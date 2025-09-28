import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../App';

const ProjectList = ({ onSelectProject, isOffline }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getAll();
      setProjects(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load projects');
      console.error('Error loading projects:', err);
      
      // Try to load from localStorage for offline mode
      const cachedProjects = localStorage.getItem('cached_projects');
      if (cachedProjects) {
        setProjects(JSON.parse(cachedProjects));
        setError('Using cached data - some changes may not be saved');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project) => {
    onSelectProject(project);
    // Cache project for offline use
    localStorage.setItem('current_project', JSON.stringify(project));
    // Don't auto-navigate - let user choose sheet type
  };

  const createSampleProject = async () => {
    const sampleProject = {
      name: "Greene Renovation",
      client_info: {
        full_name: "Emileigh Greene",
        email: "emileigh.greene@goldcreekfoods.com",
        phone: "6782305388",
        address: "4567 Crooked Creek Road, Gainesville, Georgia, 30506"
      },
      project_type: "Renovation",
      timeline: "NOW",
      budget: "600k-1M", 
      style_preferences: ["Transitional", "Traditional"],
      color_palette: "Neutral with pops of color",
      special_requirements: "Pet-friendly materials"
    };

    try {
      const response = await projectAPI.create(sampleProject);
      await loadProjects();
      handleSelectProject(response.data);
    } catch (err) {
      setError('Failed to create sample project');
      console.error('Error creating project:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Interior Design Projects</h1>
          <p className="text-gray-400">Select a project to manage FF&E or create a new one</p>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={createSampleProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            🏠 Create Sample Project
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors">
            📥 Import from Sheets
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🏗️</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
          <p className="text-gray-400 mb-6">Get started by creating your first interior design project</p>
          <button
            onClick={createSampleProject}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-lg transition-colors"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-gray-800 rounded-xl p-6 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700"
              onClick={() => handleSelectProject(project)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                  {project.project_type}
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-300">
                  <span className="font-medium">Client:</span> {project.client_info.full_name}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Timeline:</span> {project.timeline || 'Not specified'}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Budget:</span> {project.budget || 'Not specified'}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Rooms:</span> {project.rooms?.length || 0}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-xs text-green-400">Active</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
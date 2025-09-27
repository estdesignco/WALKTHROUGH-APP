import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}`);
        if (response.ok) {
          const projectData = await response.json();
          setProject(projectData);
        } else {
          setError('Failed to load project');
        }
      } catch (err) {
        setError('Error loading project: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E293B] p-8 flex items-center justify-center">
        <div className="text-[#F5F5DC] text-xl">Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1E293B] p-8 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#1E293B] p-8 flex items-center justify-center">
        <div className="text-[#F5F5DC] text-xl">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E293B] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/studio" className="flex items-center text-[#B49B7E] hover:text-[#F5F5DC] transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Studio
          </Link>
        </div>

        {/* Header */}
        <div className="bg-[#2D3748] rounded-lg shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-[#B49B7E]">{project.name}</h1>
            <div className="text-[#F5F5DC] text-sm">
              Project ID: {project.id}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-[#F5F5DC]">
            <div>
              <span className="text-[#B49B7E] font-semibold">Client:</span>
              <div>{project.client_name || 'Not specified'}</div>
            </div>
            <div>
              <span className="text-[#B49B7E] font-semibold">Email:</span>
              <div>{project.email || 'Not specified'}</div>
            </div>
            <div>
              <span className="text-[#B49B7E] font-semibold">Phone:</span>
              <div>{project.phone || 'Not specified'}</div>
            </div>
            <div>
              <span className="text-[#B49B7E] font-semibold">Budget:</span>
              <div>{project.budget_range || 'Not specified'}</div>
            </div>
          </div>
        </div>

        {/* Workflow Navigation */}
        <div className="bg-[#2D3748] rounded-lg shadow-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-[#B49B7E] mb-6">Project Workflow</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Questionnaire Tab */}
            <Link
              to={`/project/${projectId}/questionnaire`}
              className="bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 p-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-white text-center">
                <div className="text-2xl mb-2">📋</div>
                <div className="font-bold text-lg">Questionnaire</div>
                <div className="text-sm opacity-90">Client Information</div>
              </div>
            </Link>

            {/* Walkthrough Tab */}
            <Link
              to={`/project/${projectId}/walkthrough`}
              className="bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 p-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-white text-center">
                <div className="text-2xl mb-2">🚶‍♀️</div>
                <div className="font-bold text-lg">Walkthrough</div>
                <div className="text-sm opacity-90">Room Assessment</div>
              </div>
            </Link>

            {/* Checklist Tab */}
            <Link
              to={`/project/${projectId}/checklist`}
              className="bg-gradient-to-br from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 p-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-white text-center">
                <div className="text-2xl mb-2">✅</div>
                <div className="font-bold text-lg">Checklist</div>
                <div className="text-sm opacity-90">Product Curation</div>
              </div>
            </Link>

            {/* FF&E Tab */}
            <Link
              to={`/project/${projectId}/ffe`}
              className="bg-gradient-to-br from-orange-600 to-orange-800 hover:from-orange-700 hover:to-orange-900 p-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-white text-center">
                <div className="text-2xl mb-2">🪑</div>
                <div className="font-bold text-lg">FF&E</div>
                <div className="text-sm opacity-90">Final Specification</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Project Stats */}
        {project.rooms && project.rooms.length > 0 && (
          <div className="bg-[#2D3748] rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-[#B49B7E] mb-6">Project Rooms</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.rooms.map((room) => (
                <div key={room.id} className="bg-[#1E293B] p-4 rounded-lg">
                  <div className="font-semibold text-[#B49B7E] mb-2">{room.name}</div>
                  <div className="text-[#F5F5DC] text-sm">
                    {room.items ? `${room.items.length} items` : 'No items'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
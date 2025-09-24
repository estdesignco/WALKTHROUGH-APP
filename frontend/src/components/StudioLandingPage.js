import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../App';
import TeamsIntegration from './TeamsIntegration';
import UnifiedFurnitureSearch from './UnifiedFurnitureSearch';

const StudioLandingPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ email: '', name: '' });
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
    } finally {
      setLoading(false);
    }
  };

  const handleNewClient = () => {
    navigate('/questionnaire/new');
  };

  const handleEmailNewClient = () => {
    setShowEmailModal(true);
  };

  const handleFullQuestionnaire = () => {
    navigate('/questionnaire/demo');
  };

  const handleSendEmail = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/send-questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_name: emailData.name,
          client_email: emailData.email,
          sender_name: 'Established Design Co.'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Success! Questionnaire email sent to ${emailData.name} at ${emailData.email}`);
        setShowEmailModal(false);
        setEmailData({ email: '', name: '' });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(`Failed to send email: ${error.message}`);
    }
  };

  const handleProjectClick = (project) => {
    navigate(`/project/${project.id}`);
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectAPI.delete(projectId);
        loadProjects();
      } catch (err) {
        console.error('Error deleting project:', err);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B49B7E] mx-auto"></div>
          <p style={{ color: '#F5F5DC' }} className="mt-4 opacity-80">Loading studio projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header with Logo */}
      <div className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] border-b border-[#B49B7E]/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center">
            <img
              src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png"
              alt="Established Design Co."
              className="h-16 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Studio Projects Header and Action Buttons */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-light text-[#B49B7E] tracking-wide">Studio Projects</h2>
          
          <div className="flex space-x-4">
            <button
              onClick={handleNewClient}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg"
              style={{ color: '#F5F5DC' }}
            >
              <span>+</span>
              <span>New Client</span>
            </button>
            
            <button
              onClick={handleEmailNewClient}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg"
              style={{ color: '#F5F5DC' }}
            >
              <span>📧</span>
              <span>Email New Client</span>
            </button>
            
            <button
              onClick={handleFullQuestionnaire}
              className="bg-gradient-to-br from-black/80 to-gray-900/90 hover:from-gray-900/80 hover:to-black/90 px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 border border-[#B49B7E]/30"
              style={{ color: '#F5F5DC' }}
            >
              <span>+</span>
              <span>Full Questionnaire</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Projects List */}
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🏗️</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
              <p className="text-gray-400 mb-6">Get started by creating your first client project</p>
              <button
                onClick={handleNewClient}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-lg transition-colors"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 cursor-pointer hover:bg-gray-750 transition-colors"
                onClick={() => handleProjectClick(project)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                        {project.name}
                      </h3>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-400">Last Updated</span>
                        <button
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-1">
                      {project.client_info?.full_name}
                    </p>
                    
                    <p className="text-gray-400 mb-4">
                      {project.client_info?.address}
                    </p>
                    
                    <div className="text-right">
                      <span className="text-sm text-gray-400">
                        {formatDate(project.updated_at || project.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Teams Integration Section */}
      <div className="mb-8">
        <TeamsIntegration />
      </div>

      {/* Unified Furniture Search - THE DREAM! */}
      <div className="mb-8">
        <UnifiedFurnitureSearch />
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Email Client Questionnaire</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={emailData.name}
                  onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter client name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailData.email}
                  onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!emailData.email || !emailData.name}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
              >
                Send Questionnaire
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioLandingPage;
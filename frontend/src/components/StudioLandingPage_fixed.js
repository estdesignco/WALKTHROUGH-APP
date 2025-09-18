import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../App';

const StudioLandingPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ email: '', name: '' });
  const [deletingProject, setDeletingProject] = useState(null);
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
    navigate(`/project/${project.id}/walkthrough`);
  };

  const handleDeleteProject = async (projectId, projectName, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${projectName}"? This will also delete all associated rooms and items. This cannot be undone.`)) {
      setDeletingProject(projectId);
      try {
        await projectAPI.delete(projectId);
        loadProjects();
      } catch (err) {
        console.error('Error deleting project:', err);
        alert("There was an error deleting the project.");
      } finally {
        setDeletingProject(null);
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
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355] mx-auto"></div>
          <p className="text-stone-400 mt-4">Loading studio projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200">
      {/* Header with Logo */}
      <div className="w-full bg-[#1E293B] shadow-lg flex items-center justify-center my-8 h-auto max-h-[150px] p-4 rounded-lg border border-[#8B7355]/50 mx-4">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/3b546fdf5_Establishedlogo.png"
          alt="Established Design Co."
          className="w-full h-full object-contain"
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Studio Projects Header and Action Buttons */}
        <div className="flex justify-between items-center pb-4 border-b border-stone-700 mb-8">
          <h1 className="text-4xl font-bold" style={{color: '#8B7355'}}>Studio Projects</h1>
          <div className="flex gap-3">
            <button
              onClick={handleNewClient}
              className="bg-[#B49B7E] hover:bg-[#A08B6F] text-white font-semibold py-3 px-5 rounded-lg shadow-md transition-all duration-300 text-base flex items-center space-x-2"
            >
              <span>+</span>
              <span>New Client</span>
            </button>
            
            <button
              onClick={handleEmailNewClient}
              className="bg-[#8B7355] hover:bg-[#A0927B] text-white font-semibold py-3 px-5 rounded-lg shadow-md transition-all duration-300 text-base flex items-center space-x-2"
            >
              <span>📧</span>
              <span>Email New Client</span>
            </button>
            
            <button
              onClick={handleFullQuestionnaire}
              className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-5 rounded-lg shadow-md transition-all duration-300 text-base flex items-center space-x-2"
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
        {projects.length === 0 ? (
          <div className="text-center py-20 bg-[#1E293B]/50 rounded-lg border-2 border-dashed border-stone-700">
            <div className="text-6xl mb-4">🏗️</div>
            <h3 className="mt-4 text-xl font-medium text-stone-300">Your Project Library is Empty</h3>
            <p className="mt-2 text-md text-stone-400">Get started by creating your first project file.</p>
            <button
              onClick={handleNewClient}
              className="bg-[#8B7355] hover:bg-[#A0927B] text-white px-8 py-3 rounded-lg transition-colors mt-6"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-[#1E293B] hover:bg-[#2D3748] border border-stone-700 hover:border-[#8B7355] rounded-lg shadow-lg transition-all duration-300"
              >
                <div className="absolute top-3 right-3 z-10 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEmailData({ email: project.client_info?.email || '', name: project.client_info?.full_name || project.name });
                      setShowEmailModal(true);
                    }}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/50 bg-blue-900/30 p-2 rounded"
                    title="Email Client"
                  >
                    📧
                  </button>
                  <button
                    onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                    disabled={deletingProject === project.id}
                    className="text-stone-400 hover:text-red-500 hover:bg-red-900/50 p-2 rounded"
                    title="Delete Project"
                  >
                    {deletingProject === project.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      '🗑️'
                    )}
                  </button>
                </div>
                <div 
                  className="block p-6 cursor-pointer"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-[#A0927B] group-hover:text-[#8B7355] transition-colors">
                        {project.name}
                      </h2>
                      <p className="text-sm text-stone-400 mt-1">
                        {project.client_info?.full_name}
                      </p>
                    </div>
                    <div className="text-right mr-20">
                      <p className="text-xs text-stone-500">Last Updated</p>
                      <p className="text-sm text-stone-400">
                        {formatDate(project.updated_at || project.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-md text-stone-300 mt-4 border-t border-stone-700 pt-4 flex justify-between items-center">
                    <span>{project.client_info?.address}</span>
                    <span className="text-sm font-semibold text-[#8B7355] opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-20">
                      View Project →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2D3748] border border-stone-700 text-stone-200 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-[#8B7355] mb-4">Email Client Questionnaire</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={emailData.name}
                  onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                  placeholder="Enter client name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailData.email}
                  onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 text-stone-200 border-stone-600 hover:bg-stone-700 hover:text-white bg-gray-600 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!emailData.email || !emailData.name}
                className="flex-1 px-4 py-2 bg-[#8B7355] hover:bg-[#A0927B] disabled:bg-gray-600 text-white rounded-md transition-colors"
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
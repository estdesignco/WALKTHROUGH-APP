import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedFurnitureSearch from './UnifiedFurnitureSearch';

const StudioLandingPage = () => {
  const [projects] = useState([
    {
      id: '1',
      name: 'Emergency Test Project',
      client_info: { full_name: 'Emergency Test Client', address: '123 Test St' },
      updated_at: '2025-09-24T17:39:48.346000'
    },
    {
      id: '2', 
      name: 'Test Project for Dashboards',
      client_info: { full_name: 'Test Client', address: '456 Demo Ave' },
      updated_at: '2025-09-24T16:05:46.929000'
    }
  ]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ email: '', name: '' });
  const navigate = useNavigate();

  const handleNewClient = () => {
    navigate('/questionnaire/new');
  };

  const handleEmailNewClient = () => {
    setShowEmailModal(true);
  };

  const handleFullQuestionnaire = () => {
    navigate('/questionnaire/demo');
  };

  const handleProjectClick = (project) => {
    navigate(`/project/${project.id}`);
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      // Handle delete logic
      alert(`Project ${projectId} would be deleted`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black" style={{ fontFamily: 'Century Gothic, sans-serif' }}>
      {/* Header with Logo */}
      <div className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] shadow-2xl flex items-center justify-center px-2 py-1" style={{ height: '180px' }}>
        <img
          src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png"
          alt="Established Design Co."
          className="w-full h-full object-contain"
          style={{ transform: 'scale(2.2)', maxWidth: '98%', maxHeight: '95%' }}
        />
      </div>

      {/* Main Content Container */}
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-black/60 to-gray-900/80 p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-[#B49B7E] tracking-wide mb-6">Studio Projects</h2>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto"></div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={handleNewClient}
            className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide"
            style={{ color: '#F5F5DC' }}
          >
            + New Client
          </button>
          
          <button
            onClick={handleEmailNewClient}
            className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide"
            style={{ color: '#F5F5DC' }}
          >
            📧 Email New Client
          </button>
          
          <button
            onClick={handleFullQuestionnaire}
            className="bg-gradient-to-br from-black/80 to-gray-900/90 hover:from-gray-900/80 hover:to-black/90 px-8 py-4 text-xl font-medium rounded-full transition-all duration-300 border border-[#B49B7E]/30 tracking-wide"
            style={{ color: '#F5F5DC' }}
          >
            + Full Questionnaire
          </button>
        </div>

        {/* Projects List */}
        <div className="space-y-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-gradient-to-br from-black/80 to-gray-900/90 rounded-2xl border border-[#B49B7E]/20 p-8 cursor-pointer hover:border-[#B49B7E]/40 transition-all duration-300 shadow-2xl backdrop-blur-sm"
              onClick={() => handleProjectClick(project)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-light text-[#B49B7E] tracking-wide">
                  {project.name}
                </h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm" style={{ color: '#F5F5DC', opacity: '0.7' }}>Last Updated</span>
                  <button
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="hover:text-red-400 transition-colors"
                    style={{ color: '#F5F5DC', opacity: '0.7' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <p style={{ color: '#F5F5DC' }}>
                  <span className="font-medium text-[#B49B7E]">Client:</span> {project.client_info?.full_name}
                </p>
                <p style={{ color: '#F5F5DC' }}>
                  <span className="font-medium text-[#B49B7E]">Address:</span> {project.client_info?.address}
                </p>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-[#B49B7E]/20">
                <div className="flex space-x-2">
                  <span className="w-2 h-2 bg-[#B49B7E] rounded-full"></span>
                  <span className="text-xs text-[#B49B7E]">Active</span>
                </div>
                <span className="text-sm" style={{ color: '#F5F5DC', opacity: '0.7' }}>
                  Created {formatDate(project.updated_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unified Furniture Search - THE MAIN FEATURE! */}
      <div className="mb-8">
        <UnifiedFurnitureSearch />
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-black/60 to-gray-900/80 rounded-3xl p-8 w-full max-w-md mx-4 border border-[#B49B7E]/20 shadow-2xl backdrop-blur-sm">
            <h3 className="text-2xl font-light text-[#B49B7E] mb-6 text-center">Email Client Questionnaire</h3>
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto mb-8"></div>
            
            <div className="space-y-6">
              <input
                type="text"
                value={emailData.name}
                onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-[#B49B7E]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] focus:bg-black/60 transition-all duration-300"
                style={{ color: '#F5F5DC' }}
                placeholder="Enter client name"
              />
              
              <input
                type="email"
                value={emailData.email}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-[#B49B7E]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] focus:bg-black/60 transition-all duration-300"
                style={{ color: '#F5F5DC' }}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="flex justify-center gap-4 pt-8">
              <button
                onClick={() => {
                  alert(`Questionnaire would be sent to ${emailData.name} at ${emailData.email}`);
                  setShowEmailModal(false);
                  setEmailData({ email: '', name: '' });
                }}
                disabled={!emailData.email || !emailData.name}
                className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] disabled:from-gray-600 disabled:to-gray-700 px-12 py-4 text-xl font-light rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide"
                style={{ color: '#F5F5DC' }}
              >
                Send Questionnaire
              </button>
              
              <button
                onClick={() => setShowEmailModal(false)}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-8 py-3 text-lg font-light rounded-full transition-all duration-300 tracking-wide"
                style={{ color: '#F5F5DC' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioLandingPage;
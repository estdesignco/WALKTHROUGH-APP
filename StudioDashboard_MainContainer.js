import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudioMainContainer = ({ projects, onNewClient, onEmailClient, onFullQuestionnaire }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-gradient-to-br from-black/60 to-gray-900/80 p-8 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-8">
      {/* Header - Same style as Questionnaire */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-light text-[#B49B7E] tracking-wide mb-6">Studio Projects</h2>
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto"></div>
      </div>

      {/* Action Buttons - Same style as Questionnaire */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <button
          onClick={onNewClient}
          className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide"
          style={{ color: '#F5F5DC' }}
        >
          + New Client
        </button>
        
        <button
          onClick={onEmailClient}
          className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide"
          style={{ color: '#F5F5DC' }}
        >
          📧 Email New Client
        </button>
        
        <button
          onClick={onFullQuestionnaire}
          className="bg-gradient-to-br from-black/80 to-gray-900/90 hover:from-gray-900/80 hover:to-black/90 px-8 py-4 text-xl font-medium rounded-full transition-all duration-300 border border-[#B49B7E]/30 tracking-wide"
          style={{ color: '#F5F5DC' }}
        >
          📋 Full Questionnaire
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl text-[#B49B7E] mb-4">No Projects Yet</h3>
            <p style={{ color: '#F5F5DC', opacity: '0.7' }} className="mb-6">
              Start by creating your first client project or sending a questionnaire.
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}/walkthrough`)}
              className="bg-gradient-to-br from-black/40 to-gray-900/60 hover:from-black/60 hover:to-gray-900/80 p-6 rounded-2xl border border-[#B49B7E]/20 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-[#B49B7E]/10 hover:scale-[1.02]"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-medium text-[#B49B7E] mb-2">{project.name}</h3>
                  <p style={{ color: '#F5F5DC', opacity: '0.8' }} className="text-sm">
                    Client: {project.client_info?.full_name || 'Unknown'}
                  </p>
                </div>
                <span className="px-3 py-1 bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-500/30 text-green-400 text-sm rounded-full">
                  Active
                </span>
              </div>
              
              <div className="flex justify-between text-sm" style={{ color: '#F5F5DC', opacity: '0.6' }}>
                <span>Created: {formatDate(project.created_at)}</span>
                <span>Updated: {formatDate(project.updated_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudioMainContainer;
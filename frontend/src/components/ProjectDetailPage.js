import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionnaireView from './QuestionnaireView';
import WalkthroughView from './WalkthroughView';
import ChecklistView from './ChecklistView';
import FFEView from './FFEView';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('questionnaire');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects/${projectId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const projectData = await response.json();
        setProject(projectData);
        setError(null);
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Error Loading Project: {error}</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => navigate('/')}
          className="text-white hover:text-stone-300 transition-colors duration-200 flex items-center space-x-2 p-2 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)',
            border: '1px solid #d4af37',
            boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3)'
          }}
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Gold Header with Logo */}
      <div className="w-full h-32" style={{ 
        background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
        boxShadow: '0 4px 20px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}>
        <div className="flex items-center justify-center h-full relative px-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
            alt="ESTABLISHEDDESIGN CO." 
            className="w-full h-20 object-contain filter drop-shadow-lg"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.2))',
              maxWidth: '100%'
            }}
          />
        </div>
      </div>

      {/* Project Info */}
      <div className="px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">
            {project?.name || 'Project Name'}
          </h1>
          <p className="text-stone-400">
            Client: {project?.client_info?.full_name || 'Unknown Client'}
          </p>
          {project?.client_info?.address && (
            <p className="text-stone-400">
              Address: {project.client_info.address}
            </p>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex space-x-1 mb-8">
            <button
              onClick={() => handleTabChange('questionnaire')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'questionnaire'
                  ? 'bg-amber-700 text-white'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>📋</span>
              <span>Questionnaire</span>
            </button>
            <button
              onClick={() => handleTabChange('walkthrough')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'walkthrough'
                  ? 'bg-amber-700 text-white'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>🏠</span>
              <span>Walkthrough</span>
            </button>
            <button
              onClick={() => handleTabChange('checklist')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'checklist'
                  ? 'bg-amber-700 text-white'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>✅</span>
              <span>Checklist</span>
            </button>
            <button
              onClick={() => handleTabChange('ffe')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'ffe'
                  ? 'bg-amber-700 text-white'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>📊</span>
              <span>FF&E</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'questionnaire' && <QuestionnaireView project={project} />}
          {activeTab === 'walkthrough' && <WalkthroughView project={project} />}
          {activeTab === 'checklist' && <ChecklistView project={project} />}
          {activeTab === 'ffe' && <FFEView project={project} />}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
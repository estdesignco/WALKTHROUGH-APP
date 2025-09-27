import React, { useState, useEffect } from 'react';
import { projectAPI } from '../App';

const StudioLandingPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    client_info: {
      full_name: '',
      email: '',
      phone: '',
      address: ''
    },
    project_type: 'Renovation',
    timeline: '3-6 months',
    budget_range: '$10,000-$25,000'
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      console.log('🔥 LOADING PROJECTS - START');
      const response = await projectAPI.getAll();
      console.log('🔥 API RESPONSE:', response);
      console.log('🔥 RESPONSE DATA:', response.data);
      console.log('🔥 PROJECTS COUNT:', response.data?.length || 0);
      setProjects(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load projects: ' + err.message);
      console.error('❌ ERROR loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewClient = () => {
    setShowNewClientModal(true);
  };

  const handleEmailNewClient = () => {
    console.log('Email new client clicked');
  };

  const handleFullQuestionnaire = () => {
    window.location.href = '/questionnaire/new';
  };

  const handleSubmitNewClient = async (e) => {
    e.preventDefault();
    try {
      const response = await projectAPI.create(newClientForm);
      console.log('Project created:', response.data);
      setShowNewClientModal(false);
      setNewClientForm({
        name: '',
        client_info: { full_name: '', email: '', phone: '', address: '' },
        project_type: 'Renovation',
        timeline: '3-6 months',
        budget_range: '$10,000-$25,000'
      });
      loadProjects(); // Reload projects
    } catch (err) {
      setError('Failed to create project: ' + err.message);
    }
  };

  const handleFormChange = (field, value) => {
    if (field.includes('client_info.')) {
      const clientField = field.split('.')[1];
      setNewClientForm(prev => ({
        ...prev,
        client_info: {
          ...prev.client_info,
          [clientField]: value
        }
      }));
    } else {
      setNewClientForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const sendQuestionnaireEmail = async () => {
    try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/send-questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'client@example.com',
          clientName: 'Client Name',
          projectName: 'New Project'
        }),
      });

      if (response.ok) {
        alert('Questionnaire email sent successfully!');
      } else {
        alert('Failed to send questionnaire email');
      }
    } catch (err) {
      alert('Error sending questionnaire email');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #1a202c 0%, #2d3748 50%, #1a202c 100%)' }}>
      {/* Header */}
      <div className="border-b border-gray-700 px-6 py-4">
        <h1 className="text-6xl font-bold" style={{ color: '#B49B7E' }}>ESTABLISHEDDESIGN CO.</h1>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Studio Projects Header and Action Buttons */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold" style={{ color: '#B49B7E' }}>Studio Projects</h2>
          
          <div className="flex space-x-4">
            <button
              onClick={handleNewClient}
              className="px-6 py-3 rounded-lg font-bold transition-colors"
              style={{ 
                background: 'linear-gradient(to right, #B49B7E, #8B6914)',
                color: '#000000'
              }}
            >
              + New Client
            </button>
            
            <button
              onClick={handleEmailNewClient}
              className="px-6 py-3 rounded-lg font-bold transition-colors"
              style={{ 
                background: 'linear-gradient(to right, #B49B7E, #8B6914)',
                color: '#000000'
              }}
            >
              📧 Email New Client
            </button>
            
            <button
              onClick={handleFullQuestionnaire}
              className="px-6 py-3 rounded-lg font-bold transition-colors"
              style={{ 
                background: 'linear-gradient(to right, #B49B7E, #8B6914)',
                color: '#000000'
              }}
            >
              📋 Full Questionnaire
            </button>
            
            <button
              onClick={() => window.location.href = '/studio-search'}
              className="px-6 py-3 rounded-lg font-bold transition-colors"
              style={{ 
                background: 'linear-gradient(to right, #B49B7E, #8B6914)',
                color: '#000000'
              }}
            >
              🔍 Furniture Search
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#B49B7E' }}></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: '#F5F5DC' }}>Your Project Library is Empty</h3>
            <p className="mb-6" style={{ color: '#F5F5DC', opacity: 0.8 }}>Start your first project by creating a new client or sending a questionnaire.</p>
            <button
              onClick={handleNewClient}
              className="px-6 py-3 rounded-lg font-bold"
              style={{ 
                background: 'linear-gradient(to right, #B49B7E, #8B6914)',
                color: '#000000'
              }}
            >
              + Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-6 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                style={{ background: 'rgba(45, 55, 72, 0.8)' }}
                onClick={() => window.location.href = `/project/${project.id}/detail`}
              >
                <h3 className="text-xl font-bold mb-3" style={{ color: '#B49B7E' }}>
                  {project.name}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm" style={{ color: '#F5F5DC' }}>
                    <span style={{ color: '#B49B7E' }}>Client:</span>{' '}
                    {project.client_info?.full_name || 'Not specified'}
                  </p>
                  <p className="text-sm" style={{ color: '#F5F5DC' }}>
                    <span style={{ color: '#B49B7E' }}>Type:</span>{' '}
                    {project.project_type || 'Not specified'}
                  </p>
                  <p className="text-sm" style={{ color: '#F5F5DC' }}>
                    <span style={{ color: '#B49B7E' }}>Budget:</span>{' '}
                    {project.budget_range || 'Not specified'}
                  </p>
                </div>
                
                <div className="flex justify-between items-center text-xs" style={{ color: '#B49B7E', opacity: 0.8 }}>
                  <span>{project.rooms?.length || 0} rooms</span>
                  <span>Last Updated: {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'Invalid Date'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Client Modal */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-lg p-6 w-full max-w-lg" style={{ background: '#2D3748' }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#B49B7E' }}>New Client Project</h2>
            
            <form onSubmit={handleSubmitNewClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#F5F5DC' }}>
                  Project Name
                </label>
                <input
                  type="text"
                  value={newClientForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:border-[#B49B7E] focus:outline-none"
                  style={{ background: '#1A202C', color: '#F5F5DC' }}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#F5F5DC' }}>
                  Client Full Name
                </label>
                <input
                  type="text"
                  value={newClientForm.client_info.full_name}
                  onChange={(e) => handleFormChange('client_info.full_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:border-[#B49B7E] focus:outline-none"
                  style={{ background: '#1A202C', color: '#F5F5DC' }}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#F5F5DC' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={newClientForm.client_info.email}
                  onChange={(e) => handleFormChange('client_info.email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:border-[#B49B7E] focus:outline-none"
                  style={{ background: '#1A202C', color: '#F5F5DC' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#F5F5DC' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newClientForm.client_info.phone}
                  onChange={(e) => handleFormChange('client_info.phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:border-[#B49B7E] focus:outline-none"
                  style={{ background: '#1A202C', color: '#F5F5DC' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#F5F5DC' }}>
                  Project Type
                </label>
                <select
                  value={newClientForm.project_type}
                  onChange={(e) => handleFormChange('project_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:border-[#B49B7E] focus:outline-none"
                  style={{ background: '#1A202C', color: '#F5F5DC' }}
                >
                  <option value="New Construction">New Construction</option>
                  <option value="Renovation">Renovation</option>
                  <option value="Design Consultation">Design Consultation</option>
                  <option value="Furniture Only">Furniture Only</option>
                </select>
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg font-medium"
                  style={{ 
                    background: 'linear-gradient(to right, #B49B7E, #8B6914)',
                    color: '#000000'
                  }}
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="flex-1 py-2 px-4 rounded-lg font-medium border border-gray-600"
                  style={{ color: '#F5F5DC' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioLandingPage;
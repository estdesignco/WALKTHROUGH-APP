import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}`);
      
      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
        setFormData({
          name: projectData.name || '',
          client_name: projectData.client_info?.full_name || '',
          email: projectData.client_info?.email || '',
          phone: projectData.client_info?.phone || '',
          address: projectData.client_info?.address || '',
          contact_preferences: projectData.client_info?.communication_method || '',
          timeline: projectData.timeline || '',
          budget_range: projectData.budget || '',
          project_type: projectData.project_type || '',
          ...projectData.questionnaire_data
        });
      } else {
        throw new Error('Failed to load project');
      }
    } catch (err) {
      setError('Failed to load project details');
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
        setEditMode(false);
        alert('Project updated successfully!');
      } else {
        throw new Error('Failed to update project');
      }
    } catch (err) {
      setError('Failed to save changes');
      console.error('Error saving project:', err);
      alert('Failed to save changes');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7355] mx-auto mb-4"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#8B7355] text-white rounded hover:bg-[#9c8563] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)'
    }}>
      {/* Header */}
      <div className="w-full h-32" style={{ 
        background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
        boxShadow: '0 4px 20px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}>
        <div className="flex items-center justify-center h-full relative px-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 animate-pulse"></div>
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
            alt="ESTABLISHEDDESIGN CO." 
            className="w-full h-20 object-contain filter drop-shadow-lg"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.2))',
              maxWidth: '100%'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-transparent to-yellow-400 opacity-5 animate-pulse"></div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-[#8B7355] hover:text-[#9c8563] transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Project Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#8B7355] mb-2">
            {project?.name?.toUpperCase() || 'PROJECT DETAIL'}
          </h1>
          <p className="text-stone-300 text-lg">
            {project?.client_info?.full_name || 'Client'} - {project?.client_info?.address || 'Address'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-stone-900 rounded-lg p-1">
            <button className="px-4 py-2 rounded bg-[#8B7355] text-white">
              📋 Questionnaire
            </button>
            <button className="px-4 py-2 rounded text-stone-400 hover:text-white hover:bg-stone-800">
              🏠 Walkthrough
            </button>
            <button className="px-4 py-2 rounded text-stone-400 hover:text-white hover:bg-stone-800">
              ✅ Checklist
            </button>
            <button className="px-4 py-2 rounded text-stone-400 hover:text-white hover:bg-stone-800">
              📊 FF&E
            </button>
          </div>
        </div>

        {/* Questionnaire Content */}
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#8B7355]">Edit Project Details</h2>
            <button 
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 bg-[#8B7355] text-white rounded hover:bg-[#9c8563] transition-colors"
            >
              {editMode ? 'Cancel' : 'Edit Details'}
            </button>
          </div>

          {/* Client & Project Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-[#8B7355] mb-4">Client & Project Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Project Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full p-3 bg-stone-800 border border-stone-700 rounded text-white focus:border-[#8B7355] focus:outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-stone-800 border border-stone-700 rounded text-white">
                      {project?.name || 'Not specified'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Client Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.client_name || ''}
                      onChange={(e) => handleInputChange('client_name', e.target.value)}
                      className="w-full p-3 bg-stone-800 border border-stone-700 rounded text-white focus:border-[#8B7355] focus:outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-stone-800 border border-stone-700 rounded text-white">
                      {project?.client_info?.full_name || 'Not specified'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Email</label>
                  {editMode ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full p-3 bg-stone-800 border border-stone-700 rounded text-white focus:border-[#8B7355] focus:outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-stone-800 border border-stone-700 rounded text-white">
                      {project?.client_info?.email || 'Not specified'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Phone</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full p-3 bg-stone-800 border border-stone-700 rounded text-white focus:border-[#8B7355] focus:outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-stone-800 border border-stone-700 rounded text-white">
                      {project?.client_info?.phone || 'Not specified'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Address</label>
                  {editMode ? (
                    <textarea
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows="3"
                      className="w-full p-3 bg-stone-800 border border-stone-700 rounded text-white focus:border-[#8B7355] focus:outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-stone-800 border border-stone-700 rounded text-white">
                      {project?.client_info?.address || 'Not specified'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-[#8B7355] mb-4">Project Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Project Type</label>
                  {editMode ? (
                    <select
                      value={formData.project_type || ''}
                      onChange={(e) => handleInputChange('project_type', e.target.value)}
                      className="w-full p-3 bg-stone-800 border border-stone-700 rounded text-white focus:border-[#8B7355] focus:outline-none"
                    >
                      <option value="">Select Type</option>
                      <option value="Renovation">Renovation</option>
                      <option value="New Construction">New Construction</option>
                      <option value="Design Consultation">Design Consultation</option>
                      <option value="Furniture Only">Furniture Only</option>
                    </select>
                  ) : (
                    <div className="p-3 bg-stone-800 border border-stone-700 rounded text-white">
                      {project?.project_type || 'Not specified'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Timeline</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.timeline || ''}
                      onChange={(e) => handleInputChange('timeline', e.target.value)}
                      className="w-full p-3 bg-stone-800 border border-stone-700 rounded text-white focus:border-[#8B7355] focus:outline-none"
                      placeholder="e.g., 3-6 months"
                    />
                  ) : (
                    <div className="p-3 bg-stone-800 border border-stone-700 rounded text-white">
                      {project?.timeline || 'Not specified'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Budget Range</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.budget_range || ''}
                      onChange={(e) => handleInputChange('budget_range', e.target.value)}
                      className="w-full p-3 bg-stone-800 border border-stone-700 rounded text-white focus:border-[#8B7355] focus:outline-none"
                      placeholder="e.g., $50,000 - $75,000"
                    />
                  ) : (
                    <div className="p-3 bg-stone-800 border border-stone-700 rounded text-white">
                      {project?.budget || 'Not specified'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rooms */}
          {project?.rooms && project.rooms.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-[#8B7355] mb-4">Project Rooms</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {project.rooms.map((room, index) => (
                  <div key={room.id || index} className="p-3 bg-stone-800 border border-stone-700 rounded">
                    <h4 className="font-medium text-white">{room.name}</h4>
                    {room.description && (
                      <p className="text-sm text-stone-400 mt-1">{room.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          {editMode && (
            <div className="mt-8 text-center">
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-[#8B7355] text-white rounded-lg font-medium hover:bg-[#9c8563] transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
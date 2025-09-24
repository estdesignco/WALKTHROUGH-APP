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
        body: JSON.stringify({
          name: formData.name,
          client_info: {
            full_name: formData.client_name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            communication_method: formData.contact_preferences
          },
          timeline: formData.timeline,
          budget: formData.budget_range,
          project_type: formData.project_type,
          questionnaire_data: formData
        }),
      });

      if (response.ok) {
        setEditMode(false);
        loadProject();
        alert('Project updated successfully!');
      } else {
        throw new Error('Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355] mx-auto"></div>
          <p className="text-stone-400 mt-4">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#8B7355] hover:bg-[#A0927B] text-white px-6 py-3 rounded-lg"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const inputStyles = "bg-gray-700 border-gray-600 text-stone-200 focus:border-[#8B7355] placeholder:text-stone-500 text-sm w-full px-3 py-2 rounded-md";

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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Project Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#8B7355] mb-2">
            {project?.name?.toUpperCase() || 'UNTITLED PROJECT'}
          </h1>
          <p className="text-stone-400">{formData.client_name}</p>
          <p className="text-stone-400">{formData.address}</p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/questionnaire/${projectId}`)}
            className="bg-[#8B7355] hover:bg-[#A0927B] text-white font-semibold py-3 px-6 rounded-lg"
          >
            Questionnaire
          </button>
          <button
            onClick={() => navigate(`/project/${projectId}/walkthrough`)}
            className="bg-[#8B7355] hover:bg-[#A0927B] text-white font-semibold py-3 px-6 rounded-lg"
          >
            Walkthrough
          </button>
          <button
            onClick={() => navigate(`/project/${projectId}/checklist`)}
            className="bg-[#8B7355] hover:bg-[#A0927B] text-white font-semibold py-3 px-6 rounded-lg"
          >
            Checklist
          </button>
          <button
            onClick={() => navigate(`/project/${projectId}/ffe`)}
            className="bg-[#8B7355] hover:bg-[#A0927B] text-white font-semibold py-3 px-6 rounded-lg"
          >
            FF&E
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-[#2D3748] border border-stone-700 rounded-lg p-8">
          
          {/* Edit Project Details Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#8B7355]">Edit Project Details</h2>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Edit Details
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Client & Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#8B7355] border-b border-stone-600 pb-2">
                Client & Project Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Project Name</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={inputStyles}
                  />
                ) : (
                  <p className="text-stone-200">{formData.name || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Client Name</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.client_name || ''}
                    onChange={(e) => handleChange('client_name', e.target.value)}
                    className={inputStyles}
                  />
                ) : (
                  <p className="text-stone-200">{formData.client_name || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Project Address</label>
                {editMode ? (
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className={inputStyles}
                    rows="3"
                  />
                ) : (
                  <p className="text-stone-200">{formData.address || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Phone</label>
                {editMode ? (
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={inputStyles}
                  />
                ) : (
                  <p className="text-stone-200">{formData.phone || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Email</label>
                {editMode ? (
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={inputStyles}
                  />
                ) : (
                  <p className="text-stone-200">{formData.email || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Contact Preferences</label>
                {editMode ? (
                  <select
                    value={formData.contact_preferences || ''}
                    onChange={(e) => handleChange('contact_preferences', e.target.value)}
                    className={inputStyles}
                  >
                    <option value="">Select...</option>
                    <option value="Email">Email</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Text Message">Text Message</option>
                  </select>
                ) : (
                  <p className="text-stone-200">{formData.contact_preferences || 'Not specified'}</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#8B7355] border-b border-stone-600 pb-2">
                Project Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Project Type</label>
                {editMode ? (
                  <select
                    value={formData.project_type || ''}
                    onChange={(e) => handleChange('project_type', e.target.value)}
                    className={inputStyles}
                  >
                    <option value="">Select...</option>
                    <option value="New Build">New Build</option>
                    <option value="Renovation">Renovation</option>
                    <option value="Furniture/Styling Refresh">Furniture/Styling Refresh</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-stone-200">{formData.project_type || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Timeline</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.timeline || ''}
                    onChange={(e) => handleChange('timeline', e.target.value)}
                    className={inputStyles}
                  />
                ) : (
                  <p className="text-stone-200">{formData.timeline || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Budget Range</label>
                {editMode ? (
                  <select
                    value={formData.budget_range || ''}
                    onChange={(e) => handleChange('budget_range', e.target.value)}
                    className={inputStyles}
                  >
                    <option value="">Select...</option>
                    <option value="$15k-$30k">$15k-$30k</option>
                    <option value="$30k-$50k">$30k-$50k</option>
                    <option value="$50k-$75k">$50k-$75k</option>
                    <option value="$75k-$100k">$75k-$100k</option>
                    <option value="$100k-$150k">$100k-$150k</option>
                    <option value="$150k+">$150k+</option>
                  </select>
                ) : (
                  <p className="text-stone-200">{formData.budget_range || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Worked with Designer Before</label>
                <p className="text-stone-200 text-sm">{formData.worked_with_designer_before || 'Not specified'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Desired Involvement Level</label>
                <p className="text-stone-200 text-sm">{formData.involvement_level || 'Not specified'}</p>
              </div>

            </div>
          </div>

          {/* Questionnaire Summary */}
          {formData.design_styles_preference && (
            <div className="mt-8 pt-8 border-t border-stone-600">
              <h3 className="text-lg font-semibold text-[#8B7355] mb-4">Questionnaire Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {formData.design_styles_preference && (
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">Style Preferences</label>
                    <p className="text-stone-200 text-sm">{Array.isArray(formData.design_styles_preference) ? formData.design_styles_preference.join(', ') : formData.design_styles_preference}</p>
                  </div>
                )}

                {formData.design_preferred_palette && (
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">Color Palette</label>
                    <p className="text-stone-200 text-sm">{Array.isArray(formData.design_preferred_palette) ? formData.design_preferred_palette.join(', ') : formData.design_preferred_palette}</p>
                  </div>
                )}

                {formData.rooms_involved && (
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">Rooms Involved</label>
                    <p className="text-stone-200 text-sm">{Array.isArray(formData.rooms_involved) ? formData.rooms_involved.join(', ') : formData.rooms_involved}</p>
                  </div>
                )}

                {formData.project_priority && (
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">Project Priorities</label>
                    <p className="text-stone-200 text-sm">{Array.isArray(formData.project_priority) ? formData.project_priority.join(', ') : formData.project_priority}</p>
                  </div>
                )}

                {formData.design_love_home && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-300 mb-1">What they love about their current home</label>
                    <p className="text-stone-200 text-sm">{formData.design_love_home}</p>
                  </div>
                )}

                {formData.design_first_impression && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-300 mb-1">Desired first impression</label>
                    <p className="text-stone-200 text-sm">{formData.design_first_impression}</p>
                  </div>
                )}

                {formData.know_you_household && (
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">Household Members</label>
                    <p className="text-stone-200 text-sm">{formData.know_you_household}</p>
                  </div>
                )}

                {formData.know_you_pets && (
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">Pets</label>
                    <p className="text-stone-200 text-sm">{formData.know_you_pets}</p>
                  </div>
                )}

                {formData.know_you_hobbies && (
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">Hobbies</label>
                    <p className="text-stone-200 text-sm">{formData.know_you_hobbies}</p>
                  </div>
                )}

                {formData.know_you_entertaining_style && (
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">Entertaining Style</label>
                    <p className="text-stone-200 text-sm">{formData.know_you_entertaining_style}</p>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg"
            >
              ← Back to Projects
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
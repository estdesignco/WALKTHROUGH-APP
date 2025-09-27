import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Mail, FileText, ExternalLink } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const ProjectList = ({ onSelectProject, isOffline }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    clientName: '',
    clientEmail: '',
    projectName: '',
    message: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      setError('Error loading projects: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/email/send-questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailForm),
      });

      if (response.ok) {
        alert('Questionnaire email sent successfully!');
        setShowEmailModal(false);
        setEmailForm({ clientName: '', clientEmail: '', projectName: '', message: '' });
      } else {
        alert('Failed to send email. Please try again.');
      }
    } catch (err) {
      alert('Error sending email: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E293B] p-8 flex items-center justify-center">
        <div className="text-[#F5F5DC] text-xl">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E293B] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#B49B7E] mb-2">Studio Projects</h1>
            <p className="text-[#F5F5DC] text-lg">Manage your interior design projects</p>
          </div>
          
          <div className="flex space-x-4">
            <Link
              to="/customer/questionnaire"
              className="bg-gradient-to-r from-[#B49B7E] to-[#8B6914] hover:from-[#A08B6F] hover:to-[#7A5A0F] text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              <span>New Client</span>
            </Link>
            
            <button
              onClick={() => setShowEmailModal(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-300"
            >
              <Mail className="w-5 h-5" />
              <span>Email New Client</span>
            </button>
            
            <Link
              to="/customer/questionnaire"
              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-300"
            >
              <FileText className="w-5 h-5" />
              <span>Full Questionnaire</span>
            </Link>
          </div>
        </div>

        {/* Projects Grid */}
        {error ? (
          <div className="text-red-400 text-center py-8">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-[#2D3748] rounded-lg shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#B49B7E] mb-2">{project.name}</h3>
                    <p className="text-[#F5F5DC] text-sm mb-1">
                      Client: {project.client_name || 'Not specified'}
                    </p>
                    {project.email && (
                      <p className="text-[#F5F5DC] text-sm mb-1">
                        Email: {project.email}
                      </p>
                    )}
                    {project.budget_range && (
                      <p className="text-[#F5F5DC] text-sm">
                        Budget: {project.budget_range}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-5 h-5 text-[#B49B7E]" />
                </div>
                
                <div className="space-y-2 mb-4">
                  {project.rooms && project.rooms.length > 0 && (
                    <div className="text-[#F5F5DC] text-sm">
                      Rooms: {project.rooms.map(room => room.name).join(', ')}
                    </div>
                  )}
                </div>
                
                <Link
                  to={`/project/${project.id}/detail`}
                  onClick={() => onSelectProject && onSelectProject(project)}
                  className="block w-full bg-gradient-to-r from-[#B49B7E] to-[#8B6914] hover:from-[#A08B6F] hover:to-[#7A5A0F] text-white text-center py-2 px-4 rounded-lg font-semibold transition-all duration-300"
                >
                  View Project
                </Link>
              </div>
            ))}
            
            {projects.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-[#F5F5DC] text-xl mb-4">No projects yet</div>
                <Link
                  to="/customer/questionnaire"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#B49B7E] to-[#8B6914] hover:from-[#A08B6F] hover:to-[#7A5A0F] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Project</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#2D3748] rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-[#B49B7E] mb-4">Send Questionnaire Email</h2>
              
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-[#F5F5DC] text-sm font-medium mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={emailForm.clientName}
                    onChange={(e) => setEmailForm({...emailForm, clientName: e.target.value})}
                    className="w-full px-3 py-2 bg-[#1E293B] border border-gray-600 text-[#F5F5DC] rounded-lg focus:border-[#B49B7E] focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[#F5F5DC] text-sm font-medium mb-2">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={emailForm.clientEmail}
                    onChange={(e) => setEmailForm({...emailForm, clientEmail: e.target.value})}
                    className="w-full px-3 py-2 bg-[#1E293B] border border-gray-600 text-[#F5F5DC] rounded-lg focus:border-[#B49B7E] focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[#F5F5DC] text-sm font-medium mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={emailForm.projectName}
                    onChange={(e) => setEmailForm({...emailForm, projectName: e.target.value})}
                    className="w-full px-3 py-2 bg-[#1E293B] border border-gray-600 text-[#F5F5DC] rounded-lg focus:border-[#B49B7E] focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[#F5F5DC] text-sm font-medium mb-2">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    value={emailForm.message}
                    onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 bg-[#1E293B] border border-gray-600 text-[#F5F5DC] rounded-lg focus:border-[#B49B7E] focus:outline-none"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-[#B49B7E] hover:bg-[#A08B6F] text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Send Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
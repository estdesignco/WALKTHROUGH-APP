import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const StudioLandingPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    project_type: 'Design Consultation',
    timeline: '',
    budget: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${newClientData.full_name} Project`,
          client_info: newClientData,
          project_type: newClientData.project_type,
          timeline: newClientData.timeline,
          budget: newClientData.budget
        })
      });
      
      if (response.ok) {
        setShowModal(false);
        setNewClientData({
          full_name: '',
          email: '',
          phone: '',
          address: '',
          project_type: 'Design Consultation',
          timeline: '',
          budget: ''
        });
        loadProjects();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Action Buttons */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex gap-3">
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg">
            📦 Export FF&E
          </button>
          <button className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg">
            📊 Spec Sheet
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-yellow-700 hover:bg-yellow-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg"
          >
            ✨ Add Room
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-[#D4C5A0] py-12">
        <div className="text-center">
          <h1 className="text-5xl font-light text-black tracking-widest">
            ESTABLISHEDDESIGN CO.
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Studio Projects Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-[#B49B7E] mb-4">
            Studio Projects
          </h2>
          <div className="w-24 h-0.5 bg-[#B49B7E] mx-auto"></div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 mb-12">
          <button 
            onClick={() => setShowModal(true)}
            className="bg-[#B49B7E] hover:bg-[#A08B6F] text-white px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2"
          >
            + New Client
          </button>
          <Link
            to="/email-preview"
            className="bg-[#B49B7E] hover:bg-[#A08B6F] text-white px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2"
          >
            ✉ Email New Client
          </Link>
          <Link
            to="/questionnaire/new"
            className="bg-gray-700 hover:bg-gray-800 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2"
          >
            + Full Questionnaire
          </Link>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B49B7E] mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading projects...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project, index) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="block border border-gray-700 rounded-lg p-6 hover:border-[#B49B7E]/50 transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">{project.name}</h3>
                    <p className="text-gray-400 mb-1">
                      Client: <span className="text-white">{project.client_info?.full_name || 'Unknown Client'}</span>
                    </p>
                    {project.client_info?.address && (
                      <p className="text-gray-400">
                        Address: <span className="text-white">{project.client_info.address}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-400">Last Updated</span>
                      <span className="text-gray-400">📄</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-400 text-sm">Active</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            
            {projects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No projects found. Create your first project!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-light text-[#B49B7E] mb-6 text-center">
              Add New Client
            </h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newClientData.full_name}
                onChange={(e) => setNewClientData({ ...newClientData, full_name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#B49B7E]"
              />
              <input
                type="email"
                placeholder="Email"
                value={newClientData.email}
                onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#B49B7E]"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newClientData.phone}
                onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#B49B7E]"
              />
              <input
                type="text"
                placeholder="Address"
                value={newClientData.address}
                onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#B49B7E]"
              />
            </div>
            
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleCreateProject}
                className="flex-1 bg-[#B49B7E] hover:bg-[#A08B6F] text-white py-3 rounded-lg transition-all duration-300"
              >
                Create Project
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-all duration-300"
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
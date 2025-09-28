import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MainDashboard = () => {
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-[#C8B898] py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <img 
                src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
                alt="Established Design Co." 
                className="h-12 mx-auto mb-2"
              />
              <h1 className="text-3xl font-light text-black tracking-widest">
                ESTABLISHED DESIGN CO.
              </h1>
              <p className="text-lg text-black/80 font-light">
                Complete Interior Design Workflow System
              </p>
            </div>
            
            {/* Top Action Buttons */}
            <div className="flex gap-3">
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300">
                📦 Export FF&E
              </button>
              <button className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300">
                📊 Spec Sheet
              </button>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-yellow-700 hover:bg-yellow-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
              >
                ✨ Add Room
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Access Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Link
            to="/furniture-search"
            className="bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 p-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-center"
          >
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-bold mb-2">Furniture Search</h3>
            <p className="text-sm opacity-80">Unified vendor search</p>
          </Link>
          
          <Link
            to="/email-preview"
            className="bg-gradient-to-br from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 p-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-center"
          >
            <div className="text-3xl mb-3">✉️</div>
            <h3 className="text-lg font-bold mb-2">Email Templates</h3>
            <p className="text-sm opacity-80">Client communication</p>
          </Link>
          
          <Link
            to="/customer/questionnaire"
            className="bg-gradient-to-br from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 p-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-center"
          >
            <div className="text-3xl mb-3">📋</div>
            <h3 className="text-lg font-bold mb-2">Questionnaire</h3>
            <p className="text-sm opacity-80">Client intake form</p>
          </Link>
          
          <Link
            to="/workflow-dashboard"
            className="bg-gradient-to-br from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 p-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-center"
          >
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-bold mb-2">Analytics</h3>
            <p className="text-sm opacity-80">Workflow metrics</p>
          </Link>
        </div>

        {/* Project Management Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-light text-gray-300">Studio Projects</h2>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2"
              >
                + New Client
              </button>
              <Link
                to="/email-preview"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2"
              >
                ✉ Email New Client
              </Link>
              <Link
                to="/customer/questionnaire"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2"
              >
                + Full Questionnaire
              </Link>
              <Link
                to="/furniture-search"
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2"
              >
                🔍 Furniture Search
              </Link>
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading projects...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-medium text-white mb-2">{project.name}</h3>
                      <p className="text-gray-400 mb-1">
                        <span className="text-blue-400">Client:</span> {project.client_info?.full_name || 'Unknown Client'}
                      </p>
                      {project.client_info?.address && (
                        <p className="text-gray-400 text-sm">
                          📍 {project.client_info.address}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-400 text-sm">Active</span>
                    </div>
                  </div>
                  
                  {/* Project Action Buttons - The 4 Main Spreadsheets */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Link
                      to={`/project/${project.id}/questionnaire`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm text-center transition-all duration-300"
                    >
                      📋 Questionnaire
                    </Link>
                    <Link
                      to={`/project/${project.id}/walkthrough`}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm text-center transition-all duration-300"
                    >
                      🚶 Walkthrough
                    </Link>
                    <Link
                      to={`/project/${project.id}/checklist`}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm text-center transition-all duration-300"
                    >
                      ✅ Checklist
                    </Link>
                    <Link
                      to={`/project/${project.id}/ffe`}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded text-sm text-center transition-all duration-300"
                    >
                      📊 FF&E
                    </Link>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center pt-3 border-t border-gray-700">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              {projects.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-6xl mb-4">🏠</div>
                  <h3 className="text-xl text-gray-400 mb-2">No projects yet</h3>
                  <p className="text-gray-500 mb-6">Create your first project to get started</p>
                  <button 
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-300"
                  >
                    + Create First Project
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-light text-gray-300 mb-6 text-center">
              Add New Client
            </h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newClientData.full_name}
                onChange={(e) => setNewClientData({ ...newClientData, full_name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={newClientData.email}
                onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newClientData.phone}
                onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Address"
                value={newClientData.address}
                onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleCreateProject}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-all duration-300"
              >
                Create Project
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-all duration-300"
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

export default MainDashboard;
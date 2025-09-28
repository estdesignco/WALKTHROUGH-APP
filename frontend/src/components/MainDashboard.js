import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../App';

const MainDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectAPI.getAll();
        const mappedProjects = (response.data || []).map(project => ({
          id: project.id,
          name: project.name,
          clientName: project.client_info?.full_name || 'Unknown Client',
          address: project.client_info?.address || '',
          status: 'Active',
          lastUpdated: new Date(project.updated_at).toLocaleDateString() || 'Unknown',
          createdDate: new Date(project.created_at).toLocaleDateString() || 'Unknown'
        }));
        setProjects(mappedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.4)), url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIGZpbGw9IiMyMjIyMjIiLz48L3N2Zz4=')`",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Top Navigation Buttons */}
      <div className="flex justify-end items-start pt-4 pr-6 space-x-3">
        <button 
          onClick={() => handleNavigation('/advanced-features')}
          className="bg-amber-800 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg"
        >
          <span>📊</span>
          <span>Export FF&E</span>
        </button>
        <button 
          onClick={() => handleNavigation('/workflow-dashboard')}
          className="bg-amber-800 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg"
        >
          <span>📋</span>
          <span>Spec Sheet</span>
        </button>
        <button 
          onClick={() => alert('Add Room functionality coming soon!')}
          className="bg-amber-800 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg"
        >
          <span>➕</span>
          <span>Add Room</span>
        </button>
      </div>

      {/* Main Content Container */}
      <div className="flex flex-col items-center justify-center min-h-screen px-8">
        {/* Logo with Shimmer Effect */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-light text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 animate-pulse mb-6" style={{
            textShadow: '0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3), 0 0 60px rgba(251, 191, 36, 0.2)',
            fontFamily: 'serif',
            letterSpacing: '0.1em'
          }}>
            ESTABLISHEDDESIGN CO.
          </h1>
          
          <p className="text-xl text-stone-300 mb-12 max-w-3xl leading-relaxed">
            Creating extraordinary spaces that reflect your unique story and elevate your everyday life
          </p>
        </div>

        {/* Dashboard Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12 max-w-4xl w-full">
          {/* Email Templates */}
          <button
            onClick={() => handleNavigation('/email-preview')}
            className="bg-gradient-to-br from-amber-900 to-amber-800 hover:from-amber-800 hover:to-amber-700 text-white p-6 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 border border-amber-600"
          >
            <div className="text-3xl mb-3">📧</div>
            <div className="font-semibold text-lg">Email Templates</div>
            <div className="text-sm opacity-80 mt-2">Send client questionnaires</div>
          </button>

          {/* New Client Questionnaire */}
          <button
            onClick={() => handleNavigation('/questionnaire/new')}
            className="bg-gradient-to-br from-amber-900 to-amber-800 hover:from-amber-800 hover:to-amber-700 text-white p-6 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 border border-amber-600"
          >
            <div className="text-3xl mb-3">📝</div>
            <div className="font-semibold text-lg">New Client</div>
            <div className="text-sm opacity-80 mt-2">Start questionnaire</div>
          </button>

          {/* Walkthrough App */}
          <button
            onClick={() => projects.length > 0 ? handleNavigation(`/walkthrough/${projects[0].id}`) : alert('No projects available')}
            className="bg-gradient-to-br from-amber-900 to-amber-800 hover:from-amber-800 hover:to-amber-700 text-white p-6 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 border border-amber-600"
          >
            <div className="text-3xl mb-3">🏠</div>
            <div className="font-semibold text-lg">Walkthrough App</div>
            <div className="text-sm opacity-80 mt-2">On-site project work</div>
          </button>

          {/* Furniture Search */}
          <button
            onClick={() => handleNavigation('/furniture-search')}
            className="bg-gradient-to-br from-amber-900 to-amber-800 hover:from-amber-800 hover:to-amber-700 text-white p-6 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 border border-amber-600"
          >
            <div className="text-3xl mb-3">🔍</div>
            <div className="font-semibold text-lg">Furniture Search</div>
            <div className="text-sm opacity-80 mt-2">Find products across vendors</div>
          </button>

          {/* Studio Landing */}
          <button
            onClick={() => handleNavigation('/studio')}
            className="bg-gradient-to-br from-amber-900 to-amber-800 hover:from-amber-800 hover:to-amber-700 text-white p-6 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 border border-amber-600"
          >
            <div className="text-3xl mb-3">🎨</div>
            <div className="font-semibold text-lg">Studio Landing</div>
            <div className="text-sm opacity-80 mt-2">Beautiful portfolio view</div>
          </button>

          {/* Customer Questionnaire */}
          <button
            onClick={() => handleNavigation('/customer/questionnaire')}
            className="bg-gradient-to-br from-amber-900 to-amber-800 hover:from-amber-800 hover:to-amber-700 text-white p-6 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 border border-amber-600"
          >
            <div className="text-3xl mb-3">👤</div>
            <div className="font-semibold text-lg">Customer Portal</div>
            <div className="text-sm opacity-80 mt-2">Client questionnaire</div>
          </button>
        </div>

        {/* Projects Section */}
        {!loading && projects.length > 0 && (
          <div className="w-full max-w-4xl">
            <h2 className="text-2xl font-light text-stone-300 mb-6 text-center">Active Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 6).map((project) => (
                <div 
                  key={project.id}
                  onClick={() => handleProjectClick(project.id)}
                  className="bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 rounded-lg p-4 cursor-pointer hover:from-stone-700 hover:to-stone-800 transition-all duration-200 transform hover:scale-102 shadow-lg"
                >
                  <h3 className="text-lg text-stone-200 font-medium mb-2">{project.name}</h3>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-stone-400">
                      Client: {project.clientName}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-stone-400">{project.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {projects.length > 6 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => handleNavigation('/projects')}
                  className="bg-amber-800 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  View All Projects ({projects.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainDashboard;
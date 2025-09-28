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
    <div className="min-h-screen bg-black">
      {/* Large Beige Header with Logo */}
      <div className="w-full h-32 bg-gradient-to-r from-amber-100 to-stone-200" style={{ 
        background: 'linear-gradient(135deg, #f5f5dc 0%, #e8dcc6 100%)'
      }}>
        <div className="flex items-center justify-center h-full">
          <h1 className="text-5xl font-serif text-black tracking-wider">
            ESTABLISHEDDESIGN CO.
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-12">
        {/* Studio Projects Title */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-light text-stone-400 mb-2">Studio Projects</h2>
          <div className="w-16 h-px bg-stone-600 mx-auto"></div>
        </div>

        {/* Three Main Action Buttons */}
        <div className="flex justify-center space-x-4 mb-12">
          <button 
            onClick={() => handleNavigation('/questionnaire/new')}
            className="bg-amber-700 hover:bg-amber-600 text-white px-8 py-3 rounded-full font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>+</span>
            <span>New Client</span>
          </button>
          <button 
            onClick={() => handleNavigation('/email-preview')}
            className="bg-amber-700 hover:bg-amber-600 text-white px-8 py-3 rounded-full font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>📧</span>
            <span>Email New Client</span>
          </button>
          <button 
            onClick={() => handleNavigation('/customer/questionnaire')}
            className="bg-amber-700 hover:bg-amber-600 text-white px-8 py-3 rounded-full font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>+</span>
            <span>Full Questionnaire</span>
          </button>
        </div>

        {/* Project Cards */}
        <div className="max-w-4xl mx-auto space-y-4">
          {!loading && projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className="bg-gray-900 border border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-800 transition-colors duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl text-stone-300 font-medium">{project.projectName}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-stone-500">Last Updated</span>
                  <div className="w-4 h-4 bg-stone-600 rounded"></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-stone-500">Client:</span>
                    <span className="text-sm text-stone-300">{project.clientName}</span>
                  </div>
                  {project.address && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-stone-500">Address:</span>
                      <span className="text-sm text-stone-300">{project.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-right space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-stone-300">{project.status}</span>
                  </div>
                  <div className="text-sm text-stone-500">Created {project.createdDate}</div>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="text-center text-stone-400 py-8">
              <p className="text-lg">Loading projects...</p>
            </div>
          )}
        </div>

        {/* Additional Navigation Links */}
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleNavigation('/furniture-search')}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-4 rounded-lg transition-colors duration-200"
          >
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-sm">Furniture Search</div>
          </button>
          
          <button
            onClick={() => projects.length > 0 ? handleNavigation(`/walkthrough/${projects[0].id}`) : alert('No projects available')}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-4 rounded-lg transition-colors duration-200"
          >
            <div className="text-2xl mb-2">🏠</div>
            <div className="text-sm">Walkthrough App</div>
          </button>
          
          <button
            onClick={() => handleNavigation('/advanced-features')}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-4 rounded-lg transition-colors duration-200"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm">Export FF&E</div>
          </button>
          
          <button
            onClick={() => handleNavigation('/workflow-dashboard')}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-4 rounded-lg transition-colors duration-200"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm">Spec Sheet</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
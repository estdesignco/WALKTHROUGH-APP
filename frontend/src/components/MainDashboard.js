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
        console.log('🔄 Fetching projects from API...');
        const response = await projectAPI.getAll();
        console.log('📡 API Response:', response);
        
        // Handle both response.data and direct array response
        const projectsData = response.data || response || [];
        console.log('📊 Projects data:', projectsData);
        
        // Map the API response to the expected format
        const mappedProjects = projectsData.map(project => ({
          id: project.id,
          name: project.name,
          clientName: project.client_info?.full_name || 'Unknown Client',
          address: project.client_info?.address || '',
          status: 'Active',
          lastUpdated: new Date(project.updated_at).toLocaleDateString() || 'Unknown',
          createdDate: new Date(project.created_at).toLocaleDateString() || 'Unknown'
        }));
        
        console.log('✅ Mapped projects:', mappedProjects);
        setProjects(mappedProjects);
      } catch (error) {
        console.error('❌ Error fetching projects:', error);
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
    // Navigate to the project detail page with 4 tabs (Questionnaire, Walkthrough, Checklist, FF&E)
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Gold Header with Full-Width Logo */}
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

      {/* Main Content */}
      <div className="px-8 py-12">
        {/* Navigation Links at Top with Thin Gold Borders */}
        <div className="max-w-4xl mx-auto mb-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleNavigation('/furniture-search')}
            className="text-stone-300 p-4 rounded-lg transition-all duration-200"
            style={{
              background: `linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)`,
              border: '1px solid #8b7355',
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.2)'
            }}
          >
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-sm">Furniture Search</div>
          </button>
          
          <button
            onClick={() => projects.length > 0 ? handleNavigation(`/project/${projects[0].id}?tab=Walkthrough`) : alert('No projects available')}
            className="text-stone-300 p-4 rounded-lg transition-all duration-200"
            style={{
              background: `linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)`,
              border: '1px solid #8b7355',
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.2)'
            }}
          >
            <div className="text-2xl mb-2">🏠</div>
            <div className="text-sm">Walkthrough</div>
          </button>
          
          <button
            onClick={() => projects.length > 0 ? handleNavigation(`/project/${projects[0].id}?tab=Checklist`) : alert('No projects available')}
            className="text-stone-300 p-4 rounded-lg transition-all duration-200"
            style={{
              background: `linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)`,
              border: '1px solid #8b7355',
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.2)'
            }}
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm">Checklist</div>
          </button>
          
          <button
            onClick={() => projects.length > 0 ? handleNavigation(`/project/${projects[0].id}?tab=FF&E`) : alert('No projects available')}
            className="text-stone-300 p-4 rounded-lg transition-all duration-200"
            style={{
              background: `linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)`,
              border: '1px solid #8b7355',
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.2)'
            }}
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm">FF&E</div>
          </button>
        </div>

        {/* Three Main Action Buttons - NO BORDERS */}
        <div className="flex justify-center space-x-4 mb-12">
          <button 
            onClick={() => handleNavigation('/customer')}
            className="text-white px-8 py-3 rounded-full font-medium transition-all duration-200 flex items-center space-x-2"
            style={{
              background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.3))'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(139, 115, 85, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
          >
            <span>+</span>
            <span>New Client</span>
          </button>
          <button 
            onClick={() => handleNavigation('/email-preview')}
            className="text-white px-8 py-3 rounded-full font-medium transition-all duration-200 flex items-center space-x-2"
            style={{
              background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.3))'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(139, 115, 85, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
          >
            <span>📧</span>
            <span>Email New Client</span>
          </button>
          <button 
            onClick={() => handleNavigation('/customer/questionnaire')}
            className="text-white px-8 py-3 rounded-full font-medium transition-all duration-200 flex items-center space-x-2"
            style={{
              background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.3))'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(139, 115, 85, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
          >
            <span>📋</span>
            <span>Full Questionnaire</span>
          </button>
        </div>

        {/* Studio Projects Title - Moved Below */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-light text-stone-400 mb-2">Studio Projects</h2>
          <div className="w-16 h-px bg-stone-600 mx-auto"></div>
        </div>

        {/* Project Cards */}
        <div className="max-w-4xl mx-auto space-y-4">
          {!loading && projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className="rounded-lg p-6 cursor-pointer transition-all duration-200"
              style={{
                background: `linear-gradient(135deg, #000000 0%, #0a0a1a 30%, #1a1a2e 60%, #0a0a1a 100%)`,
                border: '1px solid #8b7355',
                boxShadow: '0 4px 15px rgba(139, 115, 85, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = '#d4af37';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 115, 85, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = '#8b7355';
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl text-stone-300 font-medium">{project.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-stone-500">Last Updated</span>
                  <div className="w-4 h-4 bg-stone-600 rounded"></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-4">
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
              
              {/* Project Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/walkthrough/${project.id}`);
                  }}
                  className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs transition-colors duration-200"
                >
                  Walkthrough
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/checklist/${project.id}`);
                  }}
                  className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs transition-colors duration-200"
                >
                  Checklist
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/ffe/${project.id}`);
                  }}
                  className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs transition-colors duration-200"
                >
                  FF&E
                </button>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="text-center text-stone-400 py-8">
              <p className="text-lg">Loading projects...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
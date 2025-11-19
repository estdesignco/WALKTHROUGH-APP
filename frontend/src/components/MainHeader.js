import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const MainHeader = ({ 
  projectId, 
  activeTab = 'walkthrough',
  hideNavigation = false 
}) => {
  const [project, setProject] = useState(null);
  
  useEffect(() => {
    if (projectId) {
      axios.get(`${API_URL}/projects/${projectId}`)
        .then(response => setProject(response.data))
        .catch(err => console.error('Error loading project:', err));
    }
  }, [projectId]);
  
  const clientLastName = project?.client_info?.full_name?.split(' ').pop() || 'GREENE';
  const clientFullInfo = project?.client_info 
    ? `${project.client_info.full_name} - ${project.client_info.address}` 
    : 'Emileigh Greene - 4567 Crooked Creek Road, Gainesville, Georgia, 30506';
  
  return (
    <div className="max-w-full mx-auto bg-gradient-to-b from-black via-gray-900 to-black min-h-screen">
      {/* TOP HEADER */}
      <div className="mb-1 pt-2"> {/* Much tighter spacing */}
        <div className="text-center mb-1"> {/* Much tighter spacing */}
          <h1 className="text-4xl font-bold text-white mb-1" style={{ 
            background: 'linear-gradient(135deg, #8b7355FF 0%, #8b7355AA 20%, #8b7355 40%, #8b7355AA 80%, #8b7355FF 100%)',
            boxShadow: '0 0 25px #8b735550, inset 0 0 45px rgba(255, 255, 255, 0.12), inset 0 0 75px rgba(0, 0, 0, 0.4)',
            textShadow: '0 2px 6px rgba(0, 0, 0, 0.75), 0 0 16px rgba(255, 255, 255, 0.35)',
            color: 'white',
            display: 'inline-block',
            padding: '4px 16px',
            borderRadius: '6px'
          }}>{clientLastName}</h1>
          <p style={{ color: '#F5F5DC', opacity: '0.8' }}>{clientFullInfo}</p>
        </div>

        {!hideNavigation && (
          <>
            {/* Navigation Tabs */}
            <div className="flex justify-center space-x-8 mb-1"> {/* Much tighter spacing */}
              <a href={`/project/${projectId}/questionnaire`} className="flex items-center space-x-2 transition-colors" style={{ color: '#F5F5DC', opacity: '0.7' }} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.7'}>
                <span>📋</span>
                <span>Questionnaire</span>
              </a>
              
              {/* Walkthrough, Checklist, and FF&E tabs removed per user request */}
            </div>
          </>
        )}

        {/* LOGO BANNER */}
        <div className="rounded-lg mb-1" style={{ 
          background: 'linear-gradient(135deg, #8b7355FF 0%, #8b7355 25%, #8b7355CC 50%, #8b7355 75%, #8b7355FF 100%)',
          padding: '1px 0', 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: 'fit-content',
          boxShadow: '0 0 20px #8b735540, inset 0 0 40px rgba(255, 255, 255, 0.1), inset 0 0 70px rgba(0, 0, 0, 0.35)'
        }}> {/* Tight spacing */}
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png"
            alt="Established Design Co. Logo" 
            style={{ height: '200px', width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </div>
      </div>
    </div>
  );
};

export default MainHeader;
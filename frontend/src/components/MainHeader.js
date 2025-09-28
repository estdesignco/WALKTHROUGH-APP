import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainHeader = ({ 
  projectId, 
  activeTab = 'walkthrough', // 'walkthrough', 'checklist', 'ffe'
  hideNavigation = false 
}) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-full mx-auto bg-gradient-to-b from-black via-gray-900 to-black min-h-screen">
      {/* BACK BUTTON */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => navigate('/')}
          className="text-white hover:text-stone-300 transition-colors duration-200 flex items-center space-x-2 p-2 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)',
            border: '1px solid #d4af37',
            boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3)'
          }}
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </button>
      </div>
      
      {/* TOP HEADER */}
      <div className="mb-1 pt-2"> {/* Much tighter spacing */}
        <div className="text-center mb-1"> {/* Much tighter spacing */}
          <h1 className="text-4xl font-bold text-white mb-1" style={{ color: '#8b7355' }}>GREENE</h1> {/* Much tighter */}
          <p style={{ color: '#F5F5DC', opacity: '0.8' }}>Emileigh Greene - 4567 Crooked Creek Road, Gainesville, Georgia, 30506</p>
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
        <div className="rounded-lg mb-1" style={{ backgroundColor: '#8b7355', padding: '1px 0', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'fit-content' }}> {/* Tight spacing */}
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
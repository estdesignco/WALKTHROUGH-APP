import React from 'react';

const MainHeader = ({ 
  projectId, 
  activeTab = 'walkthrough', // 'walkthrough', 'checklist', 'ffe'
  hideNavigation = false 
}) => {
  return (
    <div className="max-w-full mx-auto bg-gradient-to-b from-black via-gray-900 to-black min-h-screen">
      {/* TOP HEADER */}
      <div className="mb-1 pt-2"> {/* Much tighter spacing */}
        <div className="text-center mb-1"> {/* Much tighter spacing */}
          <h1 className="text-5xl font-bold mb-2 px-6 py-3 rounded-lg inline-block border-2 border-[#D4A574]" style={{ 
            background: 'linear-gradient(135deg, #8b7355FF 0%, #8b7355AA 20%, #8b7355 40%, #8b7355AA 80%, #8b7355FF 100%)',
            boxShadow: '0 0 40px #8b735570, 0 0 60px #8b735530, inset 0 0 70px rgba(255, 255, 255, 0.16), inset 0 0 110px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.3)',
            textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 0 0 25px rgba(255, 255, 255, 0.45), 0 0 40px rgba(255, 255, 255, 0.25)',
            color: 'white'
          }}>GREENE</h1> {/* Much tighter */}
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

        {/* LOGO BANNER - WITH SHIMMER */}
        <div className="rounded-lg mb-1 border-2 border-[#D4A574]" style={{ 
          background: 'linear-gradient(135deg, #8b7355FF 0%, #8b7355 25%, #8b7355CC 50%, #8b7355 75%, #8b7355FF 100%)', 
          padding: '8px 0', 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 0 35px #8b735560, 0 0 50px #8b735530, inset 0 0 60px rgba(255, 255, 255, 0.12), inset 0 0 100px rgba(0, 0, 0, 0.4)'
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
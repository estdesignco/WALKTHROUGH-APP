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
              
              {activeTab === 'walkthrough' ? (
                <div className="flex items-center space-x-2" style={{ color: '#8b7355' }}>
                  <span>🚶</span>
                  <span className="font-semibold">Walkthrough</span>
                </div>
              ) : (
                <a href={`/project/${projectId}/walkthrough`} className="flex items-center space-x-2 transition-colors" style={{ color: '#F5F5DC', opacity: '0.7' }} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.7'}>
                  <span>🚶</span>
                  <span>Walkthrough</span>
                </a>
              )}

              {activeTab === 'checklist' ? (
                <div className="flex items-center space-x-2" style={{ color: '#8b7355' }}>
                  <span>✅</span>
                  <span className="font-semibold">Checklist</span>
                </div>
              ) : (
                <a href={`/project/${projectId}/checklist`} className="flex items-center space-x-2 transition-colors" style={{ color: '#F5F5DC', opacity: '0.7' }} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.7'}>
                  <span>✅</span>
                  <span>Checklist</span>
                </a>
              )}

              {activeTab === 'ffe' ? (
                <div className="flex items-center space-x-2" style={{ color: '#8b7355' }}>
                  <span>📊</span>
                  <span className="font-semibold">FF&E</span>
                </div>
              ) : (
                <a href={`/project/${projectId}/ffe`} className="flex items-center space-x-2 transition-colors" style={{ color: '#F5F5DC', opacity: '0.7' }} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.7'}>
                  <span>📊</span>
                  <span>FF&E</span>
                </a>
              )}
            </div>
          </>
        )}

        {/* LOGO BANNER */}
        <div className="rounded-lg mb-1" style={{ backgroundColor: '#8b7355', padding: '1px 0', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'fit-content' }}> {/* Much smaller margin */}
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
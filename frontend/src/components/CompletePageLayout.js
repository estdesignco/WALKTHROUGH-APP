import React from 'react';
import MainHeader from './MainHeader';
import MainContainer from './MainContainer';

const CompletePageLayout = ({ 
  projectId, 
  activeTab = 'walkthrough',
  title = "PROJECT",
  hideNavigation = false,
  onAddRoom,
  children 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      <MainHeader 
        projectId={projectId}
        activeTab={activeTab}
        hideNavigation={hideNavigation}
      />
      
      <div style={{ marginTop: '-50px' }}> {/* OVERLAP THE CONTAINER OVER HEADER */}
        <MainContainer
          title={title}
          hideNavigation={hideNavigation}
          onAddRoom={onAddRoom}
          projectId={projectId}
        >
          {children}
        </MainContainer>
      </div>
    </div>
  );
};

export default CompletePageLayout;
import React from 'react';
import MainHeader from './MainHeader';
import MainContainer from './MainContainer';

const CompletePageLayout = ({ 
  projectId, 
  activeTab = 'walkthrough',
  title = "WALKTHROUGH - GREENE",
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
        >
          {children}
        </MainContainer>
      </div>
    </div>
  );
};

// Usage Examples:

// For Walkthrough Page:
const WalkthroughExample = ({ projectId }) => (
  <CompletePageLayout 
    projectId={projectId}
    activeTab="walkthrough"
    title="WALKTHROUGH - GREENE"
    onAddRoom={() => console.log('Add room clicked')}
  >
    {/* Your spreadsheet component goes here */}
    <div className="text-[#F5F5DC]">Your Spreadsheet Component Here</div>
  </CompletePageLayout>
);

// For Checklist Page:
const ChecklistExample = ({ projectId }) => (
  <CompletePageLayout 
    projectId={projectId}
    activeTab="checklist"
    title="CHECKLIST - GREENE"
    onAddRoom={() => console.log('Add room clicked')}
  >
    {/* Your spreadsheet component goes here */}
    <div className="text-[#F5F5DC]">Your Spreadsheet Component Here</div>
  </CompletePageLayout>
);

// For FFE Page:
const FFEExample = ({ projectId }) => (
  <CompletePageLayout 
    projectId={projectId}
    activeTab="ffe"
    title="FF&E - GREENE" 
    onAddRoom={() => console.log('Add room clicked')}
  >
    {/* Your spreadsheet component goes here */}
    <div className="text-[#F5F5DC]">Your Spreadsheet Component Here</div>
  </CompletePageLayout>
);

export default CompletePageLayout;
export { WalkthroughExample, ChecklistExample, FFEExample };
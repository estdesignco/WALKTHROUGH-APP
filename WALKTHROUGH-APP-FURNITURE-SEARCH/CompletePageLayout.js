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
    <>
      <MainHeader 
        projectId={projectId}
        activeTab={activeTab}
        hideNavigation={hideNavigation}
      />
      
      <MainContainer
        title={title}
        hideNavigation={hideNavigation}
        onAddRoom={onAddRoom}
      >
        {children}
      </MainContainer>
    </>
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
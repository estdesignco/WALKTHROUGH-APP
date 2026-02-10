import React from 'react';

const MainContainer = ({ 
  title = "PROJECT", 
  hideNavigation = false,
  onAddRoom,
  children 
}) => {
  return (
    <div className="w-full max-w-[95%] mx-auto bg-gradient-to-b from-black via-gray-900 to-black p-2 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4" style={{
      background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,20,0.9) 30%, rgba(0,0,0,0.95) 100%)',
      marginTop: '-500px'
    }}> {/* EXTREME NEGATIVE MARGIN - BRING LOGO SUPER CLOSE */}
      
      {/* Page Title - NO SPACING */}
      <div className="text-center mb-1">
        <h2 className="text-3xl font-light tracking-wide mb-0 border border-[#B49B7E]/20 px-4 py-2 rounded-lg" style={{
          background: 'linear-gradient(135deg, rgba(180,155,126,0.3) 0%, rgba(180,155,126,0.2) 50%, rgba(180,155,126,0.3) 100%)',
          boxShadow: '0 0 15px rgba(180,155,126,0.2), inset 0 0 30px rgba(212, 165, 116, 0.06)',
          color: '#B49B7E'
        }}>{title}</h2>
        <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E]/20 to-transparent mx-auto"></div>
      </div>

      {/* Non-functional controls removed - actual controls are in each spreadsheet component */}

      {/* Content Area - ZERO SPACING */}
      <div className="mt-1">
        {children}
      </div>
    </div>
  );
};

export default MainContainer;
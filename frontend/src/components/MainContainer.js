import React from 'react';

const MainContainer = ({ 
  title = "WALKTHROUGH - GREENE", 
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
          color: '#B49B7E'
        }}>{title}</h2>
        <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E]/20 to-transparent mx-auto"></div>
      </div>

      {!hideNavigation && (
        <>
          {/* Action Buttons - ZERO SPACING */}
          <div className="flex justify-center gap-4 mb-1">
            <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/30 transition-all duration-300 transform hover:scale-105 tracking-wide flex items-center space-x-2 border border-[#D4C5A9]/20"
                    style={{ color: '#F5F5DC' }}> {/* DIMMED BORDER TO 20% */}
              <span>📥</span>
              <span>Export FF&E</span>
            </button>
            <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/30 transition-all duration-300 transform hover:scale-105 tracking-wide flex items-center space-x-2 border border-[#D4C5A9]/20"
                    style={{ color: '#F5F5DC' }}> {/* DIMMED BORDER TO 20% */}
              <span>📋</span>
              <span>Spec Sheet</span>
            </button>
          </div>

          {/* Search and Controls - ZERO SPACING */}
          <div className="flex items-center justify-between mt-1 p-4 rounded-2xl shadow-xl backdrop-blur-sm border border-[#B49B7E]/20" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)'
          }}>
            <div className="flex items-center space-x-4 flex-1">
              <input
                type="text"
                placeholder="Search Items..."
                className="flex-1 bg-black/60 border border-[#B49B7E]/20 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4C5A9]/20 focus:border-[#D4C5A9]/20 focus:bg-black/80 transition-all duration-300 placeholder:text-[#B49B7E]/60"
              />
              <select className="bg-black/60 border border-[#B49B7E]/20 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4C5A9]/20 focus:border-[#D4C5A9]/20 transition-all duration-300">
                <option>All Rooms</option>
              </select>
              <select className="bg-black/60 border border-[#B49B7E]/20 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4C5A9]/20 focus:border-[#D4C5A9]/20 transition-all duration-300">
                <option>All Statuses</option>
              </select>
            </div>
            {/* Add Room button removed per user request */}
          </div>
        </>
      )}

      {/* Content Area - ZERO SPACING */}
      <div className="mt-1">
        {children}
      </div>
    </div>
  );
};

export default MainContainer;
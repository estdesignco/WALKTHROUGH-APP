import React from 'react';

const MainContainer = ({ 
  title = "WALKTHROUGH - GREENE", 
  hideNavigation = false,
  onAddRoom,
  children 
}) => {
  return (
    <div className="w-full max-w-[95%] mx-auto bg-gradient-to-b from-black via-gray-900 to-black p-4 rounded-3xl shadow-2xl border border-[#B49B7E] backdrop-blur-sm mx-4" style={{
      boxShadow: '0 0 20px rgba(180, 155, 126, 0.3), inset 0 1px 0 rgba(180, 155, 126, 0.15)',
      background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,20,0.9) 30%, rgba(0,0,0,0.95) 100%)',
      marginTop: '-35px'
    }}> {/* NEGATIVE MARGIN TO REDUCE GAP */}
      
      {/* Page Title - Luxury Style with SHIMMER */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-light tracking-wide mb-2" style={{
          color: '#B49B7E'
        }}>{title}</h2>
        <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto"></div>
      </div>

      {!hideNavigation && (
        <>
          {/* Action Buttons - Same style as Studio Dashboard */}
          <div className="flex justify-center gap-4 mb-4"> {/* Smaller margin */}
            <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/30 transition-all duration-300 transform hover:scale-105 tracking-wide flex items-center space-x-2 border border-[#D4C5A9]"
                    style={{ 
                      color: '#F5F5DC',
                      boxShadow: '0 0 8px rgba(180, 155, 126, 0.2)'
                    }}>
              <span>📥</span>
              <span>Export FF&E</span>
            </button>
            <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/30 transition-all duration-300 transform hover:scale-105 tracking-wide flex items-center space-x-2 border border-[#D4C5A9]"
                    style={{ 
                      color: '#F5F5DC',
                      boxShadow: '0 0 8px rgba(180, 155, 126, 0.2)'
                    }}>
              <span>📋</span>
              <span>Spec Sheet</span>
            </button>
          </div>

          {/* Search and Controls - MINIMAL SHIMMER */}
          <div className="flex items-center justify-between mt-6 p-6 rounded-2xl shadow-xl backdrop-blur-sm border border-[#B49B7E]" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)',
            boxShadow: '0 0 12px rgba(180, 155, 126, 0.2)'
          }}>
            <div className="flex items-center space-x-4 flex-1">
              <input
                type="text"
                placeholder="Search Items..."
                className="flex-1 bg-black/60 border border-[#B49B7E] text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4C5A9] focus:border-[#D4C5A9] focus:bg-black/80 transition-all duration-300 placeholder:text-[#B49B7E]/60"
                style={{
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 0 6px rgba(180, 155, 126, 0.1)'
                }}
              />
              <select className="bg-black/60 border border-[#B49B7E] text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4C5A9] focus:border-[#D4C5A9] transition-all duration-300" style={{
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 0 6px rgba(180, 155, 126, 0.1)'
              }}>
                <option>All Rooms</option>
              </select>
              <select className="bg-black/60 border border-[#B49B7E] text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4C5A9] focus:border-[#D4C5A9] transition-all duration-300" style={{
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 0 6px rgba(180, 155, 126, 0.1)'
              }}>
                <option>All Statuses</option>
              </select>
            </div>
            <button
              onClick={onAddRoom}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-3 rounded-full shadow-xl hover:shadow-[#B49B7E]/30 transition-all duration-300 transform hover:scale-105 tracking-wide ml-4 font-medium border border-[#D4C5A9]"
              style={{ 
                color: '#F5F5DC',
                boxShadow: '0 0 8px rgba(180, 155, 126, 0.2)'
              }}
            >
              ➕ Add Room
            </button>
          </div>
        </>
      )}

      {/* Content Area */}
      <div className="mt-8">
        {children}
      </div>
    </div>
  );
};

export default MainContainer;
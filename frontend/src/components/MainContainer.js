import React from 'react';

const MainContainer = ({ 
  title = "WALKTHROUGH - GREENE", 
  hideNavigation = false,
  onAddRoom,
  children 
}) => {
  return (
    <div className="w-full max-w-[95%] mx-auto bg-gradient-to-b from-black via-gray-900 to-black p-4 rounded-3xl shadow-2xl border-2 border-[#B49B7E] backdrop-blur-sm mx-4 my-2" style={{
      boxShadow: '0 0 30px rgba(180, 155, 126, 0.4), inset 0 1px 0 rgba(180, 155, 126, 0.2)',
      background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,20,0.9) 30%, rgba(0,0,0,0.95) 100%)'
    }}> {/* THICK GOLD BORDER + GLOW */}
      
      {/* Page Title - Luxury Style with SHIMMER */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-light tracking-wide mb-2" style={{
          color: '#B49B7E',
          textShadow: '0 0 20px rgba(180, 155, 126, 0.6), 0 0 40px rgba(180, 155, 126, 0.3)',
          background: 'linear-gradient(45deg, #B49B7E, #D4C5A9, #B49B7E, #8B7355)',
          backgroundSize: '300% 300%',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'shimmer 3s ease-in-out infinite'
        }}>{title}</h2>
        <div className="w-48 h-1 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto" style={{
          boxShadow: '0 0 15px rgba(180, 155, 126, 0.8)'
        }}></div>
        
        {/* Add shimmer animation styles */}
        <style jsx>{`
          @keyframes shimmer {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </div>

      {!hideNavigation && (
        <>
          {/* Action Buttons - Same style as Studio Dashboard */}
          <div className="flex justify-center gap-4 mb-4"> {/* Smaller margin */}
            <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/50 transition-all duration-300 transform hover:scale-105 tracking-wide flex items-center space-x-2 border-2 border-[#D4C5A9]"
                    style={{ 
                      color: '#F5F5DC',
                      boxShadow: '0 0 25px rgba(180, 155, 126, 0.6), inset 0 1px 0 rgba(212, 197, 169, 0.3)'
                    }}>
              <span>📥</span>
              <span>Export FF&E</span>
            </button>
            <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/50 transition-all duration-300 transform hover:scale-105 tracking-wide flex items-center space-x-2 border-2 border-[#D4C5A9]"
                    style={{ 
                      color: '#F5F5DC',
                      boxShadow: '0 0 25px rgba(180, 155, 126, 0.6), inset 0 1px 0 rgba(212, 197, 169, 0.3)'
                    }}>
              <span>📋</span>
              <span>Spec Sheet</span>
            </button>
          </div>

          {/* Search and Controls - SHIMMERY DARK GRADIENT with GOLD GLOW */}
          <div className="flex items-center justify-between mt-6 p-6 rounded-2xl shadow-xl backdrop-blur-sm border-2 border-[#B49B7E]" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)',
            boxShadow: '0 0 30px rgba(180, 155, 126, 0.4), inset 0 1px 0 rgba(180, 155, 126, 0.2)'
          }}>
            <div className="flex items-center space-x-4 flex-1">
              <input
                type="text"
                placeholder="Search Items..."
                className="flex-1 bg-black/60 border-2 border-[#B49B7E] text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4C5A9] focus:border-[#D4C5A9] focus:bg-black/80 transition-all duration-300 placeholder:text-[#B49B7E]/60"
                style={{
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 0 15px rgba(180, 155, 126, 0.2)'
                }}
              />
              <select className="bg-black/60 border-2 border-[#B49B7E] text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4C5A9] focus:border-[#D4C5A9] transition-all duration-300" style={{
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 0 15px rgba(180, 155, 126, 0.2)'
              }}>
                <option>All Rooms</option>
              </select>
              <select className="bg-black/60 border-2 border-[#B49B7E] text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4C5A9] focus:border-[#D4C5A9] transition-all duration-300" style={{
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 0 15px rgba(180, 155, 126, 0.2)'
              }}>
                <option>All Statuses</option>
              </select>
            </div>
            <button
              onClick={onAddRoom}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-3 rounded-full shadow-xl hover:shadow-[#B49B7E]/50 transition-all duration-300 transform hover:scale-105 tracking-wide ml-4 font-medium border-2 border-[#D4C5A9]"
              style={{ 
                color: '#F5F5DC',
                boxShadow: '0 0 25px rgba(180, 155, 126, 0.6), inset 0 1px 0 rgba(212, 197, 169, 0.3)'
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
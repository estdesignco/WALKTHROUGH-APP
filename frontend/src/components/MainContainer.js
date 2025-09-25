import React from 'react';

const MainContainer = ({ 
  title = "WALKTHROUGH - GREENE", 
  hideNavigation = false,
  onAddRoom,
  children 
}) => {
  return (
    <div className="w-full max-w-[95%] mx-auto bg-gradient-to-b from-black via-gray-900 to-black p-6 rounded-3xl shadow-2xl border border-[#B49B7E]/20 backdrop-blur-sm mx-4 my-4"> {/* Reduced padding and margin */}
      
      {/* Page Title - Luxury Style */}
      <div className="text-center mb-8"> {/* Reduced from mb-12 to mb-8 */}
        <h2 className="text-3xl font-light text-[#B49B7E] tracking-wide mb-4">{title}</h2> {/* Reduced from mb-6 to mb-4 */}
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#B49B7E] to-transparent mx-auto"></div>
      </div>

      {!hideNavigation && (
        <>
          {/* Action Buttons - Same style as Studio Dashboard */}
          <div className="flex justify-center gap-4 mb-6"> {/* Reduced from mb-8 to mb-6 */}
            <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide flex items-center space-x-2"
                    style={{ color: '#F5F5DC' }}>
              <span>📥</span>
              <span>Export FF&E</span>
            </button>
            <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-8 py-4 text-xl font-medium rounded-full shadow-2xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide flex items-center space-x-2"
                    style={{ color: '#F5F5DC' }}>
              <span>📋</span>
              <span>Spec Sheet</span>
            </button>
          </div>

          {/* Search and Controls - Darker Gradient to Match Content Areas */}
          <div className="flex items-center justify-between mt-6 p-6 bg-gradient-to-b from-black via-gray-900 to-black rounded-2xl border border-[#B49B7E]/20 shadow-xl backdrop-blur-sm">
            <div className="flex items-center space-x-4 flex-1">
              <input
                type="text"
                placeholder="Search Items..."
                className="flex-1 bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] focus:bg-black/60 transition-all duration-300 placeholder:text-[#B49B7E]/50"
              />
              <select className="bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] transition-all duration-300">
                <option>All Rooms</option>
              </select>
              <select className="bg-black/40 border border-[#B49B7E]/30 text-[#F5F5DC] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B49B7E] focus:border-[#B49B7E] transition-all duration-300">
                <option>All Statuses</option>
              </select>
            </div>
            <button
              onClick={onAddRoom}
              className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] px-6 py-3 rounded-full shadow-xl hover:shadow-[#B49B7E]/25 transition-all duration-300 transform hover:scale-105 tracking-wide ml-4 font-medium"
              style={{ color: '#F5F5DC' }}
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
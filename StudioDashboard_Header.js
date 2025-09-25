import React from 'react';

const StudioHeader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black" style={{ fontFamily: 'Century Gothic, sans-serif' }}>
      {/* Header with Logo - MUCH BIGGER with minimal padding */}
      <div className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] shadow-2xl flex items-center justify-center px-2 py-1" style={{ height: '180px' }}>
        <img
          src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png"
          alt="Established Design Co."
          className="w-full h-full object-contain"
          style={{ transform: 'scale(2.2)', maxWidth: '98%', maxHeight: '95%' }}
        />
      </div>
    </div>
  );
};

export default StudioHeader;
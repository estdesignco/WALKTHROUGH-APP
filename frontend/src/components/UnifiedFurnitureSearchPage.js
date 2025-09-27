import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import UnifiedFurnitureSearch from './UnifiedFurnitureSearch';

const UnifiedFurnitureSearchPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header with ESTABLISHED DESIGN CO. Logo */}
      <div className="bg-gradient-to-r from-[#B49B7E] to-[#8B6914] border-b border-[#B49B7E]/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center text-black hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Studio
            </Link>
            <h1 className="text-4xl font-bold text-black tracking-wider">
              ESTABLISHEDDESIGN CO.
            </h1>
            <div></div> {/* Spacer for center alignment */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#B49B7E] mb-2">🔍 Unified Furniture Search Engine</h2>
          <p className="text-[#F5F5DC] text-lg opacity-80">Search products from multiple vendors and add to Houzz Pro</p>
        </div>
        
        {/* Unified Furniture Search Component */}
        <div className="bg-[#2D3748] rounded-lg shadow-xl border border-[#B49B7E]/20 p-6">
          <UnifiedFurnitureSearch />
        </div>
      </div>
    </div>
  );
};

export default UnifiedFurnitureSearchPage;
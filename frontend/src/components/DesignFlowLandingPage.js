import React from 'react';
import { Link } from 'react-router-dom';

const DesignFlowLandingPage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-[#D4C5A0] py-12">
        <div className="text-center">
          <h1 className="text-5xl font-light text-black tracking-widest mb-2">
            ESTABLISHED DESIGN CO.
          </h1>
          <p className="text-xl text-black/80 font-light">
            Complete Interior Design Workflow System
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 py-12">
        <Link
          to="/furniture-search"
          className="bg-[#B49B7E] hover:bg-[#A08B6F] text-white px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2"
        >
          🔍 Unified Search
        </Link>
        <Link
          to="/workflow-dashboard"
          className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2"
        >
          📊 Analytics Dashboard
        </Link>
        <Link
          to="/mobile-walkthrough"
          className="bg-gray-700 hover:bg-gray-800 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2"
        >
          📱 Mobile Walkthrough
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Unified Search Engine Section */}
        <div className="mb-16">
          <div className="flex justify-center items-center gap-3 mb-4">
            <span className="text-4xl">🚀</span>
            <h2 className="text-3xl font-light text-[#B49B7E]">
              UNIFIED SEARCH ENGINE
            </h2>
          </div>
          <p className="text-lg text-gray-300">
            Search ALL vendor products • Real-Time Sync • Auto-Integration
          </p>
        </div>

        {/* First Search Section */}
        <div className="mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <span className="text-3xl">🔍</span>
            <h3 className="text-2xl font-light text-[#B49B7E]">
              UNIFIED FURNITURE SEARCH ENGINE
            </h3>
          </div>
          <p className="text-gray-300">
            Search ALL Four Hands console tables • Real-Time Houzz Pro Clipper • No More Scrolling!
          </p>
        </div>

        {/* Second Search Section with border */}
        <div className="border border-gray-700 rounded-lg p-8 mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <span className="text-3xl">🔍</span>
            <h3 className="text-2xl font-light text-[#B49B7E]">
              UNIFIED FURNITURE SEARCH ENGINE
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignFlowLandingPage;
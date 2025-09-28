import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DesignFlowLandingPage = () => {
  const [vendorCredentials, setVendorCredentials] = useState([
    { name: 'Four Hands', connected: true, demo_user: true },
    { name: 'Hudson Valley Lighting', connected: true, demo_user: true }
  ]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#D4C5A0] via-[#C8B898] to-[#BCA888] py-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-light text-black tracking-[0.3em] mb-2">
            ESTABLISHED DESIGN CO.
          </h1>
          <p className="text-lg md:text-xl text-black/80 font-light">
            Complete Interior Design Workflow System
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 py-8">
        <Link
          to="/furniture-search"
          className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#B8941F] hover:to-[#9A7A1A] text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
        >
          🔍 Unified Search
        </Link>
        <Link
          to="/workflow-dashboard"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
        >
          📊 Analytics Dashboard
        </Link>
        <Link
          to="/mobile-walkthrough"
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
        >
          📱 Mobile Walkthrough
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4">
        {/* Unified Search Engine Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-3 mb-6">
            <span className="text-4xl">🚀</span>
            <h2 className="text-3xl md:text-4xl font-light text-white">
              UNIFIED SEARCH ENGINE
            </h2>
          </div>
          <p className="text-lg text-gray-300">
            Search ALL vendor products • Real-Time Sync • Auto-Integration
          </p>
        </div>

        {/* Furniture Search Sections */}
        <div className="space-y-12">
          {/* First Search Section */}
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🔍</span>
              <h3 className="text-2xl font-light text-white">
                UNIFIED FURNITURE SEARCH ENGINE
              </h3>
            </div>
            <p className="text-gray-300 mb-6">
              Search ALL Four Hands console tables • Real-Time Houzz Pro Clipper • No More Scrolling!
            </p>
          </div>

          {/* Second Search Section */}
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🔍</span>
              <h3 className="text-2xl font-light text-white">
                UNIFIED FURNITURE SEARCH ENGINE
              </h3>
            </div>
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-red-500 text-2xl">⭕</span>
                <p className="text-lg font-bold text-white">
                  THE DREAM IS REAL! Search ALL vendor products in ONE place!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Credentials Section */}
        <div className="mt-16">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-green-500 text-xl">✅</span>
            <h3 className="text-2xl font-light text-white">
              VENDOR CREDENTIALS SAVED
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vendorCredentials.map((vendor, index) => (
              <div key={index} className="bg-gray-800/60 rounded-xl p-6 border border-gray-600/50">
                <h4 className="text-xl font-medium text-white mb-4">
                  {vendor.name}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    <span className="text-gray-300">Connected: demo_user</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    <span className="text-gray-300">Status: Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">🔄</span>
                    <span className="text-gray-300">Last Sync: 2 hours ago</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 py-16">
          <Link
            to="/furniture-search"
            className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#B8941F] hover:to-[#9A7A1A] text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105"
          >
            🚀 Launch Unified Search
          </Link>
          <Link
            to="/workflow-dashboard"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105"
          >
            📊 View Analytics
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DesignFlowLandingPage;
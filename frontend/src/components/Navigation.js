import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = ({ currentProject, isOffline }) => {
  const location = useLocation();

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/3b546fdf5_Establishedlogo.png" 
              alt="Established Design Co." 
              className="h-12 w-auto"
            />
            {isOffline && (
              <div className="bg-orange-500 text-white px-2 py-1 rounded text-sm">
                OFFLINE MODE
              </div>
            )}
          </div>

          {/* Project Navigation */}
          {currentProject && (
            <div className="flex items-center space-x-6">
              <div className="text-gray-300">
                {currentProject.client_info.full_name.split(' ').pop()} - {currentProject.name}
              </div>
              
              <div className="flex space-x-1">
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    location.pathname === '/' 
                      ? 'bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] text-[#F5F5DC]' 
                      : 'text-[#F5F5DC]/70 hover:bg-[#B49B7E]/20'
                  }`}
                >
                  📋 Questionnaire
                </Link>
                <Link
                  to={`/project/${currentProject.id}/walkthrough`}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    location.pathname.includes('/walkthrough') 
                      ? 'bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] text-[#F5F5DC]' 
                      : 'text-[#F5F5DC]/70 hover:bg-[#B49B7E]/20'
                  }`}
                >
                  🚶 Walkthrough
                </Link>
                <Link
                  to={`/project/${currentProject.id}/checklist`}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    location.pathname.includes('/checklist') 
                      ? 'bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] text-[#F5F5DC]' 
                      : 'text-[#F5F5DC]/70 hover:bg-[#B49B7E]/20'  
                  }`}
                >
                  ✅ Checklist
                </Link>
                <Link
                  to={`/project/${currentProject.id}/ffe`}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    location.pathname.includes('/ffe') 
                      ? 'bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] text-[#F5F5DC]' 
                      : 'text-[#F5F5DC]/70 hover:bg-[#B49B7E]/20'
                  }`}
                >
                  📦 FF&E
                </Link>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] text-[#F5F5DC] px-4 py-2 rounded-lg transition-all duration-300">
              📤 Export FF&E
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
              📊 Spec Sheet  
            </button>
            <button className="bg-gradient-to-r from-[#B49B7E] to-[#A08B6F] hover:from-[#A08B6F] hover:to-[#8B7355] text-[#F5F5DC] px-4 py-2 rounded-lg transition-all duration-300">
              ➕ Add Room
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
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
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  📋 Questionnaire
                </Link>
                <Link
                  to={`/project/${currentProject.id}/walkthrough`}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    location.pathname.includes('/walkthrough') 
                      ? 'bg-green-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  🚶 Walkthrough
                </Link>
                <Link
                  to={`/project/${currentProject.id}/checklist`}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    location.pathname.includes('/checklist') 
                      ? 'bg-yellow-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'  
                  }`}
                >
                  ✅ Checklist
                </Link>
                <Link
                  to={`/project/${currentProject.id}/ffe`}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    location.pathname.includes('/ffe') 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  📦 FF&E
                </Link>
              </div>
            </div>
          )}

          {/* Actions removed per user request */}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
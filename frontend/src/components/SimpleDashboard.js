import React from 'react';

const SimpleDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header */}
      <div className="bg-[#B8941F] rounded-xl p-8 mb-12 text-center">
        <h1 className="text-4xl font-light text-black tracking-widest">
          ESTABLISHEDDESIGN CO.
        </h1>
        <p className="text-lg text-black/80 font-light mt-2">
          Complete Interior Design Workflow System
        </p>
      </div>

      {/* Studio Projects Title */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-light text-[#B8941F]">Studio Projects</h2>
        <div className="flex gap-4">
          <button className="bg-[#B8941F] hover:bg-[#A08B6F] text-black px-6 py-2 rounded-full font-medium transition-all duration-300">
            + New Client
          </button>
          <a 
            href="https://designflow-master.preview.emergentagent.com/email-preview" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-[#B8941F] hover:bg-[#A08B6F] text-black px-6 py-2 rounded-full font-medium transition-all duration-300 inline-block"
          >
            ✉ Email New Client
          </a>
          <a 
            href="https://designflow-master.preview.emergentagent.com/customer/questionnaire" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 inline-block"
          >
            + Full Questionnaire
          </a>
        </div>
      </div>

      {/* Main Navigation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <a 
          href="https://designflow-master.preview.emergentagent.com/studio" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 p-8 rounded-xl transition-all duration-300 transform hover:scale-105 text-center block"
        >
          <div className="text-4xl mb-4">🏠</div>
          <h3 className="text-xl font-bold mb-2">Studio Landing Page</h3>
          <p className="text-sm opacity-80">Beautiful customer-facing page</p>
        </a>
        
        <a 
          href="https://designflow-master.preview.emergentagent.com/customer/questionnaire" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-gradient-to-br from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 p-8 rounded-xl transition-all duration-300 transform hover:scale-105 text-center block"
        >
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-xl font-bold mb-2">Customer Questionnaire</h3>
          <p className="text-sm opacity-80">Client intake form</p>
        </a>
        
        <a 
          href="https://designflow-master.preview.emergentagent.com/email-preview" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-gradient-to-br from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 p-8 rounded-xl transition-all duration-300 transform hover:scale-105 text-center block"
        >
          <div className="text-4xl mb-4">✉️</div>
          <h3 className="text-xl font-bold mb-2">Email Templates</h3>
          <p className="text-sm opacity-80">Client communication</p>
        </a>
        
        <a 
          href="https://designflow-master.preview.emergentagent.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-gradient-to-br from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 p-8 rounded-xl transition-all duration-300 transform hover:scale-105 text-center block"
        >
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">Furniture Search</h3>
          <p className="text-sm opacity-80">Unified vendor search</p>
        </a>
        
        <a 
          href="https://designflow-master.preview.emergentagent.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-gradient-to-br from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 p-8 rounded-xl transition-all duration-300 transform hover:scale-105 text-center block"
        >
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-bold mb-2">Walkthrough App</h3>
          <p className="text-sm opacity-80">Project management system</p>
        </a>
        
        <a 
          href="https://designflow-master.preview.emergentagent.com/project/a332f2fb-a248-41db-9c50-f028430a6261/detail" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-gradient-to-br from-indigo-700 to-indigo-800 hover:from-indigo-800 hover:to-indigo-900 p-8 rounded-xl transition-all duration-300 transform hover:scale-105 text-center block"
        >
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-xl font-bold mb-2">Project Detail</h3>
          <p className="text-sm opacity-80">4-page workflow system</p>
        </a>
      </div>

      {/* Your Project Library */}
      <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-16 text-center">
        <div className="text-6xl mb-6">🏠</div>
        <h3 className="text-2xl font-light text-gray-400 mb-4">Your Project Library is Empty</h3>
        <p className="text-gray-500 mb-8">Get started by creating your first project file.</p>
        <button className="bg-[#B8941F] hover:bg-[#A08B6F] text-black px-8 py-3 rounded-full font-medium transition-all duration-300">
          + Create First Project
        </button>
      </div>
    </div>
  );
};

export default SimpleDashboard;
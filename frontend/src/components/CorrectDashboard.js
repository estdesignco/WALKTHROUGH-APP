import React, { useState } from 'react';

const CorrectDashboard = () => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ email: '', name: '' });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleSendEmail = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/send-questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailData.email,
          name: emailData.name
        })
      });
      
      if (response.ok) {
        alert('Email sent successfully!');
        setShowEmailModal(false);
        setEmailData({ email: '', name: '' });
      } else {
        alert('Failed to send email');
      }
    } catch (error) {
      alert('Error sending email');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Action Buttons */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex gap-3">
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg">
            📦 Export FF&E
          </button>
          <button className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg">
            📊 Spec Sheet
          </button>
          <button className="bg-yellow-700 hover:bg-yellow-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg">
            ✨ Add Room
          </button>
        </div>
      </div>

      {/* Header - Using the EXACT studio page design */}
      <div className="bg-[#C8B898] py-8">
        <div className="text-center">
          <h1 className="text-5xl font-light text-black tracking-widest">
            ESTABLISHEDDESIGN CO.
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Studio Projects Title */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-light text-[#C8B898]">Studio Projects</h2>
          <div className="flex gap-4">
            {/* EMAIL TEMPLATES FIRST - with send functionality */}
            <button 
              onClick={() => setShowEmailModal(true)}
              className="bg-[#C8B898] hover:bg-[#B8A888] text-black px-6 py-2 rounded-full font-medium transition-all duration-300"
            >
              ✉ Email Templates
            </button>
            <button className="bg-[#C8B898] hover:bg-[#B8A888] text-black px-6 py-2 rounded-full font-medium transition-all duration-300">
              + New Client
            </button>
            <a 
              href="https://designhub-74.preview.emergentagent.com/customer/questionnaire" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-full font-medium transition-all duration-300"
            >
              + Full Questionnaire
            </a>
          </div>
        </div>

        {/* All Navigation Links - KEEPING ALL THE ORIGINAL LINKS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <a 
            href="https://designhub-74.preview.emergentagent.com/studio" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 p-8 rounded-xl transition-all duration-300 transform hover:scale-105 text-center block"
          >
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-bold mb-2">Studio Landing Page</h3>
            <p className="text-sm opacity-80">Beautiful customer-facing page</p>
          </a>
          
          <a 
            href="https://designhub-74.preview.emergentagent.com/customer/questionnaire" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 p-8 rounded-xl transition-all duration-300 transform hover:scale-105 text-center block"
          >
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-2">Customer Questionnaire</h3>
            <p className="text-sm opacity-80">Client intake form</p>
          </a>
          
          <a 
            href="https://designhub-74.preview.emergentagent.com/email-preview" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 p-8 rounded-xl transition-all duration-300 transform hover:scale-105 text-center block"
          >
            <div className="text-4xl mb-4">✉️</div>
            <h3 className="text-xl font-bold mb-2">Email Preview</h3>
            <p className="text-sm opacity-80">Template preview & customization</p>
          </a>
        </div>

        {/* BIG Walkthrough and Furniture Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <a 
            href="https://designhub-74.preview.emergentagent.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-indigo-700 to-indigo-800 hover:from-indigo-800 hover:to-indigo-900 p-12 rounded-2xl transition-all duration-300 transform hover:scale-105 text-center block"
          >
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-2xl font-bold mb-4">Walkthrough App</h3>
            <p className="text-lg opacity-80">Complete project management system</p>
            <p className="text-sm opacity-60 mt-2">Includes Furniture Search tab access</p>
          </a>
          
          <a 
            href="https://designhub-74.preview.emergentagent.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 p-12 rounded-2xl transition-all duration-300 transform hover:scale-105 text-center block"
          >
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold mb-4">Furniture Search</h3>
            <p className="text-lg opacity-80">Unified vendor search engine</p>
            <p className="text-sm opacity-60 mt-2">Search all vendors in one place</p>
          </a>
        </div>

        {/* Additional Links - Project Detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a 
            href="https://designhub-74.preview.emergentagent.com/project/a332f2fb-a248-41db-9c50-f028430a6261/detail" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 p-8 rounded-xl transition-all duration-300 transform hover:scale-105 text-center block"
          >
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-2">Project Detail Example</h3>
            <p className="text-sm opacity-80">4-page workflow system</p>
          </a>
          
          <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-lg font-light text-gray-400 mb-2">Your Project Library</h3>
            <p className="text-gray-500 text-sm mb-4">Create your first project to get started</p>
            <button className="bg-[#C8B898] hover:bg-[#B8A888] text-black px-6 py-2 rounded-full font-medium transition-all duration-300">
              + Create Project
            </button>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-[#C8B898]/30 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-light text-[#C8B898] mb-6 text-center">
              Send Email Template
            </h3>
            
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Client Name"
                value={emailData.name}
                onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#C8B898]"
              />
              <input
                type="email"
                placeholder="Client Email"
                value={emailData.email}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#C8B898]"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleSendEmail}
                className="flex-1 bg-[#C8B898] hover:bg-[#B8A888] text-black py-3 rounded-lg transition-all duration-300 font-medium"
              >
                Send Email
              </button>
              <a
                href="https://designhub-74.preview.emergentagent.com/email-preview"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-all duration-300 text-center font-medium"
              >
                Preview
              </a>
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-all duration-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrectDashboard;
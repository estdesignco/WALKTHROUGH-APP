import React, { useState, useEffect } from 'react';

const ExactDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ email: '', name: '' });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleNewClient = () => {
    alert('New Client functionality');
  };

  const handleFullQuestionnaire = () => {
    window.open('https://designflow-master.preview.emergentagent.com/customer/questionnaire', '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Action Buttons - same as /studio page */}
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

      {/* Header - EXACT same beige color as /studio */}
      <div className="bg-[#C8B898] py-12">
        <div className="text-center">
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
            alt="Established Design Co." 
            className="h-16 mx-auto mb-4"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Studio Projects Title - EXACT same as /studio */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-[#C8B898] mb-4">
            Studio Projects
          </h2>
          <div className="w-24 h-0.5 bg-[#C8B898] mx-auto"></div>
        </div>

        {/* Action Buttons - EXACT same as /studio */}
        <div className="flex justify-center gap-6 mb-12">
          <button 
            onClick={handleNewClient}
            className="bg-[#C8B898] hover:bg-[#B8A888] text-black px-8 py-3 rounded-full font-medium transition-all duration-300"
          >
            + New Client
          </button>
          
          <button 
            onClick={() => setShowEmailModal(true)}
            className="bg-[#C8B898] hover:bg-[#B8A888] text-black px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2"
          >
            📧 Email New Client
          </button>
          
          <button 
            onClick={handleFullQuestionnaire}
            className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-full font-medium transition-all duration-300"
          >
            + Full Questionnaire
          </button>
        </div>

        {/* Project Cards - EXACT same styling as /studio */}
        <div className="space-y-6 mb-12">
          {/* Emergency Test Project - same as shown in /studio */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-medium text-white mb-2">Emergency Test Project</h3>
                <p className="text-[#C8B898] mb-1">
                  <span className="text-gray-400">Client:</span> Emergency Test Client
                </p>
                <p className="text-gray-400">
                  <span className="text-gray-400">Address:</span> 
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#C8B898]">Last Updated</span>
                  <span className="text-gray-400">📄</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-sm">Active</span>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Created 9/24/2025
                </p>
              </div>
            </div>
          </div>

          {/* Your actual projects */}
          {projects.map((project) => (
            <div key={project.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-medium text-white mb-2">{project.name}</h3>
                  <p className="text-[#C8B898] mb-1">
                    <span className="text-gray-400">Client:</span> {project.client_info?.full_name || 'Unknown Client'}
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-400">Address:</span> {project.client_info?.address || ''}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#C8B898]">Last Updated</span>
                    <span className="text-gray-400">📄</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 text-sm">Active</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <a 
            href="https://designflow-master.preview.emergentagent.com/customer" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 p-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-center block"
          >
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-bold mb-2">Studio Landing Page</h3>
            <p className="text-sm opacity-80">Beautiful customer-facing page</p>
          </a>
          
          <a 
            href="https://designflow-master.preview.emergentagent.com/customer/questionnaire" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 p-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-center block"
          >
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-2">Customer Questionnaire</h3>
            <p className="text-sm opacity-80">Client intake form</p>
          </a>
          
          <a 
            href="https://designflow-master.preview.emergentagent.com/email-preview" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 p-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-center block"
          >
            <div className="text-4xl mb-4">✉️</div>
            <h3 className="text-xl font-bold mb-2">Email Preview</h3>
            <p className="text-sm opacity-80">Template preview</p>
          </a>
        </div>

        {/* BIG Walkthrough and Furniture Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <a 
            href="https://designflow-master.preview.emergentagent.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-indigo-700 to-indigo-800 hover:from-indigo-800 hover:to-indigo-900 p-12 rounded-2xl transition-all duration-300 transform hover:scale-105 text-center block"
          >
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-2xl font-bold mb-4">Walkthrough App</h3>
            <p className="text-lg opacity-80">Complete project management</p>
            <p className="text-sm opacity-60 mt-2">Includes Furniture Search tab</p>
          </a>
          
          <a 
            href="https://designflow-master.preview.emergentagent.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 p-12 rounded-2xl transition-all duration-300 transform hover:scale-105 text-center block"
          >
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold mb-4">Furniture Search</h3>
            <p className="text-lg opacity-80">Unified vendor search</p>
            <p className="text-sm opacity-60 mt-2">Search all vendors in one place</p>
          </a>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-[#C8B898]/30 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-light text-[#C8B898] mb-6 text-center">
              Email New Client
            </h3>
            
            <div className="space-y-4">
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
            
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleSendEmail}
                className="flex-1 bg-[#C8B898] hover:bg-[#B8A888] text-black py-3 rounded-lg transition-all duration-300 font-medium"
              >
                Send Email
              </button>
              <a
                href="https://designflow-master.preview.emergentagent.com/email-preview"
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

export default ExactDashboard;
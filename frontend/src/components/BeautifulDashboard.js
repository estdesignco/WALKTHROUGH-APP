import React, { useState, useEffect } from 'react';

const BeautifulDashboard = () => {
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
      console.error('Failed to send email:', error);
      alert('Error sending email');
    }
  };

  return (
    <div className="min-h-screen" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2158&q=80')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
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

      {/* Header */}
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
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-[#C8B898] mb-4">
            Studio Projects
          </h2>
          <div className="w-24 h-0.5 bg-[#C8B898] mx-auto"></div>
        </div>

        {/* Main Action Buttons - REORDERED as requested */}
        <div className="flex justify-center gap-6 mb-16">
          {/* EMAIL TEMPLATES FIRST */}
          <button 
            onClick={() => setShowEmailModal(true)}
            className="bg-[#C8B898] hover:bg-[#B8A888] text-black px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 shadow-lg"
          >
            ✉ Email Templates
          </button>
          
          <button className="bg-[#C8B898] hover:bg-[#B8A888] text-black px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 shadow-lg">
            + New Client
          </button>
          
          {/* STUDIO LANDING PAGE - This should link to the customer questionnaire */}
          <a
            href="https://designflow-master.preview.emergentagent.com/customer/questionnaire"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 shadow-lg"
          >
            + Full Questionnaire
          </a>
        </div>

        {/* BIGGER Walkthrough and Furniture Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <a 
            href="https://designflow-master.preview.emergentagent.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-indigo-700/80 to-indigo-800/80 hover:from-indigo-800/80 hover:to-indigo-900/80 p-12 rounded-2xl transition-all duration-300 transform hover:scale-105 text-center block backdrop-blur-sm border border-white/10"
          >
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-2xl font-bold mb-4 text-white">Walkthrough App</h3>
            <p className="text-lg opacity-80 text-white">Complete project management system</p>
            <p className="text-sm opacity-60 text-white mt-2">Includes access to Furniture Search</p>
          </a>
          
          <a 
            href="https://designflow-master.preview.emergentagent.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-amber-700/80 to-amber-800/80 hover:from-amber-800/80 hover:to-amber-900/80 p-12 rounded-2xl transition-all duration-300 transform hover:scale-105 text-center block backdrop-blur-sm border border-white/10"
          >
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold mb-4 text-white">Furniture Search</h3>
            <p className="text-lg opacity-80 text-white">Unified vendor search engine</p>
            <p className="text-sm opacity-60 text-white mt-2">Search all vendors in one place</p>
          </a>
        </div>

        {/* Projects Display */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8B898] mx-auto"></div>
            <p className="mt-4 text-[#C8B898]">Loading projects...</p>
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-6">
            {projects.slice(0, 3).map((project) => (
              <div
                key={project.id}
                className="bg-black/40 border border-white/20 rounded-xl p-6 backdrop-blur-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">{project.name}</h3>
                    <p className="text-[#C8B898] mb-1">
                      Client: <span className="text-white">{project.client_info?.full_name || 'Unknown Client'}</span>
                    </p>
                    {project.client_info?.address && (
                      <p className="text-gray-400">
                        Address: <span className="text-white">{project.client_info.address}</span>
                      </p>
                    )}
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
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">🏠</div>
            <h3 className="text-2xl font-light text-[#C8B898] mb-4">No projects yet</h3>
            <p className="text-white/80 text-lg mb-8">
              Create your first project to get started
            </p>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-black/90 border border-[#C8B898]/30 rounded-2xl p-8 w-full max-w-md mx-4 backdrop-blur-sm">
            <h3 className="text-2xl font-light text-[#C8B898] mb-6 text-center">
              Send Email Template
            </h3>
            
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Client Name"
                value={emailData.name}
                onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-[#C8B898]"
              />
              <input
                type="email"
                placeholder="Client Email"
                value={emailData.email}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-[#C8B898]"
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
                href="https://designflow-master.preview.emergentagent.com/email-preview"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-all duration-300 text-center font-medium"
              >
                Preview Template
              </a>
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg transition-all duration-300 font-medium"
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

export default BeautifulDashboard;
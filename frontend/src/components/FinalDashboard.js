import React, { useState, useEffect } from 'react';

const FinalDashboard = () => {
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
    // Add new client functionality here
    alert('New Client functionality - to be implemented');
  };

  const handleFullQuestionnaire = () => {
    window.open('https://canvalink.preview.emergentagent.com/customer/questionnaire', '_blank');
  };

  return (
    <div className="min-h-screen" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2158&q=80')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Top Action Buttons - EXACT same as studio page */}
      <div className="absolute top-6 right-6 z-10">
        <div className="flex gap-3">
          <button className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg">
            📦 Export FF&E
          </button>
          <button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg">
            📊 Spec Sheet
          </button>
          <button className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg">
            ✨ Add Room
          </button>
        </div>
      </div>

      {/* Main Content - Centered like the studio page */}
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        {/* Logo/Brand - Using your ACTUAL logo */}
        <div className="mb-12">
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
            alt="Established Design Co." 
            className="h-20 mx-auto mb-4"
          />
          <h1 className="text-5xl md:text-6xl font-light text-[#D4AF37] mb-4 tracking-[0.2em]">
            ESTABLISHEDDESIGN CO.
          </h1>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-8"></div>
        </div>

        {/* Tagline - EXACT same as studio page */}
        <div className="max-w-4xl mb-12">
          <p className="text-xl md:text-2xl text-white/90 font-light leading-relaxed">
            Creating extraordinary spaces that reflect your unique story and elevate your everyday life
          </p>
        </div>

        {/* Video/Meet Our Team Section - Same as studio page */}
        <div className="mb-12">
          <div className="relative w-80 h-48 bg-black/40 rounded-2xl border border-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-8 border-l-white border-y-6 border-y-transparent ml-1"></div>
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium">Meet Our Team</p>
        </div>

        {/* Main Action Buttons - Same as studio page */}
        <div className="flex justify-center gap-6 mb-16">
          <button 
            onClick={handleNewClient}
            className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#B8941F] hover:to-[#9A7A1A] text-white px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            + New Client
          </button>
          
          <button 
            onClick={() => setShowEmailModal(true)}
            className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#B8941F] hover:to-[#9A7A1A] text-white px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            ✉ Email New Client
          </button>
          
          <button 
            onClick={handleFullQuestionnaire}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            + Full Questionnaire
          </button>
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-6xl">
          <a 
            href="https://canvalink.preview.emergentagent.com/customer" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-black/60 border border-white/20 rounded-2xl p-6 hover:bg-black/70 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm text-center"
          >
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-[#D4AF37] font-medium mb-2">Studio Landing Page</h3>
            <p className="text-white/80 text-sm">Beautiful customer-facing page</p>
          </a>
          
          <a 
            href="https://canvalink.preview.emergentagent.com/customer/questionnaire" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-black/60 border border-white/20 rounded-2xl p-6 hover:bg-black/70 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm text-center"
          >
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-[#D4AF37] font-medium mb-2">Customer Questionnaire</h3>
            <p className="text-white/80 text-sm">Client intake form</p>
          </a>
          
          <a 
            href="https://canvalink.preview.emergentagent.com/email-preview" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-black/60 border border-white/20 rounded-2xl p-6 hover:bg-black/70 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm text-center"
          >
            <div className="text-4xl mb-4">✉️</div>
            <h3 className="text-[#D4AF37] font-medium mb-2">Email Preview</h3>
            <p className="text-white/80 text-sm">Template preview</p>
          </a>
        </div>

        {/* BIG Walkthrough and Furniture Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl w-full">
          <a 
            href="https://canvalink.preview.emergentagent.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-black/60 border border-white/20 rounded-2xl p-12 hover:bg-black/70 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm text-center"
          >
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-2xl font-medium text-[#D4AF37] mb-4">Walkthrough App</h3>
            <p className="text-white/80 text-lg">Complete project management</p>
            <p className="text-white/60 text-sm mt-2">Includes Furniture Search tab</p>
          </a>
          
          <a 
            href="https://canvalink.preview.emergentagent.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-black/60 border border-white/20 rounded-2xl p-12 hover:bg-black/70 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm text-center"
          >
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-medium text-[#D4AF37] mb-4">Furniture Search</h3>
            <p className="text-white/80 text-lg">Unified vendor search</p>
            <p className="text-white/60 text-sm mt-2">Search all vendors in one place</p>
          </a>
        </div>

        {/* Projects Display */}
        {projects.length > 0 && (
          <div className="w-full max-w-6xl">
            <h2 className="text-2xl font-light text-[#D4AF37] mb-8 text-center">
              Current Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 6).map((project) => (
                <div
                  key={project.id}
                  className="bg-black/60 border border-white/20 rounded-2xl p-6 hover:bg-black/70 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  <h3 className="text-[#D4AF37] font-medium mb-2">{project.name}</h3>
                  <p className="text-white/80 text-sm mb-1">{project.client_info?.full_name}</p>
                  <p className="text-white/60 text-xs">{project.project_type}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-black/90 border border-[#D4AF37]/30 rounded-2xl p-8 w-full max-w-md mx-4 backdrop-blur-sm">
            <h3 className="text-2xl font-light text-[#D4AF37] mb-6 text-center">
              Email New Client
            </h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Client Name"
                value={emailData.name}
                onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-[#D4AF37]"
              />
              <input
                type="email"
                placeholder="Client Email"
                value={emailData.email}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleSendEmail}
                className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#B8941F] hover:to-[#9A7A1A] text-white py-3 rounded-lg transition-all duration-300"
              >
                Send Email
              </button>
              <a
                href="https://canvalink.preview.emergentagent.com/email-preview"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-all duration-300 text-center"
              >
                Preview
              </a>
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg transition-all duration-300"
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

export default FinalDashboard;
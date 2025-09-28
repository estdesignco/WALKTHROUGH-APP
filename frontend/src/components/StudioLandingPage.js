import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const StudioLandingPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    project_type: 'Design Consultation',
    timeline: '',
    budget: ''
  });

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

  const handleCreateProject = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${newClientData.full_name} Project`,
          client_info: newClientData,
          project_type: newClientData.project_type,
          timeline: newClientData.timeline,
          budget: newClientData.budget
        })
      });
      
      if (response.ok) {
        setShowModal(false);
        setNewClientData({
          full_name: '',
          email: '',
          phone: '',
          address: '',
          project_type: 'Design Consultation',
          timeline: '',
          budget: ''
        });
        loadProjects();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div className="min-h-screen" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2158&q=80')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Header */}
      <div className="absolute top-0 right-0 p-6 z-10">
        <div className="flex gap-3">
          <button className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg">
            📦 Export FF&E
          </button>
          <button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg">
            📊 Spec Sheet
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg"
          >
            ✨ Add Room
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        {/* Logo/Brand */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-light text-[#D4AF37] mb-4 tracking-[0.2em]">
            ESTABLISHEDDESIGN CO.
          </h1>
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-8"></div>
        </div>

        {/* Tagline */}
        <div className="max-w-4xl mb-12">
          <p className="text-xl md:text-2xl text-white/90 font-light leading-relaxed">
            Creating extraordinary spaces that reflect your unique story and elevate your everyday life
          </p>
        </div>

        {/* Video/Meet Our Team Section */}
        <div className="mb-12">
          <div className="relative w-80 h-48 bg-black/40 rounded-2xl border border-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-8 border-l-white border-y-6 border-y-transparent ml-1"></div>
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium">Meet Our Team</p>
        </div>

        {/* CTA Button */}
        <div className="mb-16">
          <Link 
            to="/customer/questionnaire"
            className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#B8941F] hover:to-[#9A7A1A] text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-2xl inline-flex items-center gap-2"
          >
            Begin Your Design Journey
            <span className="text-xl">→</span>
          </Link>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 && (
          <div className="w-full max-w-6xl">
            <h2 className="text-2xl font-light text-[#D4AF37] mb-8 text-center">
              Current Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 6).map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className="bg-black/60 border border-white/20 rounded-2xl p-6 hover:bg-black/70 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  <h3 className="text-[#D4AF37] font-medium mb-2">{project.name}</h3>
                  <p className="text-white/80 text-sm mb-1">{project.client_info?.full_name}</p>
                  <p className="text-white/60 text-xs">{project.project_type}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-black/90 border border-[#D4AF37]/30 rounded-2xl p-8 w-full max-w-md mx-4 backdrop-blur-sm">
            <h3 className="text-2xl font-light text-[#D4AF37] mb-6 text-center">
              Add New Client
            </h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newClientData.full_name}
                onChange={(e) => setNewClientData({ ...newClientData, full_name: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-[#D4AF37]"
              />
              <input
                type="email"
                placeholder="Email"
                value={newClientData.email}
                onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-[#D4AF37]"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newClientData.phone}
                onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-[#D4AF37]"
              />
              <input
                type="text"
                placeholder="Address"
                value={newClientData.address}
                onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleCreateProject}
                className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#B8941F] hover:to-[#9A7A1A] text-white py-3 rounded-lg transition-all duration-300"
              >
                Create Project
              </button>
              <button
                onClick={() => setShowModal(false)}
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

export default StudioLandingPage;
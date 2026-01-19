import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { projectAPI } from '../App';
import ProjectCalendar from './ProjectCalendar';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

// Project colors for headers - each project gets a unique color
const PROJECT_COLORS = [
  { bg: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)', border: '#CD853F', name: 'Saddle Brown' },
  { bg: 'linear-gradient(135deg, #2F4F4F 0%, #3D5C5C 100%)', border: '#5F9EA0', name: 'Dark Slate' },
  { bg: 'linear-gradient(135deg, #4A3728 0%, #5D4037 100%)', border: '#8D6E63', name: 'Coffee' },
  { bg: 'linear-gradient(135deg, #1C3A4B 0%, #2C5364 100%)', border: '#4682B4', name: 'Steel Blue' },
  { bg: 'linear-gradient(135deg, #3E2723 0%, #4E342E 100%)', border: '#795548', name: 'Espresso' },
  { bg: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)', border: '#5C6BC0', name: 'Indigo' },
  { bg: 'linear-gradient(135deg, #004D40 0%, #00695C 100%)', border: '#26A69A', name: 'Teal' },
  { bg: 'linear-gradient(135deg, #BF360C 0%, #E64A19 100%)', border: '#FF7043', name: 'Deep Orange' },
];

const MainDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ email: '', name: '' });
  const [companyTodos, setCompanyTodos] = useState([]);
  const [projectTodos, setProjectTodos] = useState({});
  const [todosLoading, setTodosLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check for extension data in URL params
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add-item') {
      const data = {
        name: searchParams.get('name'),
        price: searchParams.get('price'),
        sku: searchParams.get('sku'),
        size: searchParams.get('size'),
        finish_color: searchParams.get('finish'),
        finish_image: searchParams.get('finish_image'),
        vendor: searchParams.get('vendor'),
        link: searchParams.get('link'),
        image_url: searchParams.get('image'),
        msrp: searchParams.get('msrp')
      };
      localStorage.setItem('extensionScrapedData', JSON.stringify(data));
      alert(`✅ Product scraped!\n\nName: ${data.name}\nPrice: $${data.price || 'N/A'}\n\nGo to any project's FF&E tab - the data will auto-populate!`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectAPI.getAll();
        const projectsData = response.data || response || [];
        const mappedProjects = projectsData.map((project, index) => ({
          id: project.id,
          name: project.name,
          clientName: project.client_info?.full_name || 'Unknown Client',
          address: project.client_info?.address || '',
          status: 'Active',
          lastUpdated: new Date(project.updated_at).toLocaleDateString() || 'Unknown',
          createdDate: new Date(project.created_at).toLocaleDateString() || 'Unknown',
          color: PROJECT_COLORS[index % PROJECT_COLORS.length]
        }));
        setProjects(mappedProjects);
        
        // Load todos for each project
        for (const project of mappedProjects) {
          loadProjectTodos(project.id);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
    loadCompanyTodos();
  }, []);

  const loadCompanyTodos = async () => {
    setTodosLoading(true);
    try {
      const response = await axios.get(`${API_URL}/todos/company`);
      setCompanyTodos(response.data.todos || []);
    } catch (error) {
      console.error('Failed to load company todos:', error);
      setCompanyTodos([]);
    } finally {
      setTodosLoading(false);
    }
  };

  const loadProjectTodos = async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/todos/${projectId}`);
      setProjectTodos(prev => ({
        ...prev,
        [projectId]: response.data.todos || []
      }));
    } catch (error) {
      console.error(`Failed to load todos for project ${projectId}:`, error);
    }
  };

  const toggleTodoComplete = async (todoId, currentStatus, isCompany = true, projectId = null) => {
    try {
      const endpoint = isCompany 
        ? `${API_URL}/todos/company/${todoId}`
        : `${API_URL}/todos/${projectId}/${todoId}`;
      
      await axios.put(endpoint, { completed: !currentStatus });
      
      if (isCompany) {
        loadCompanyTodos();
      } else {
        loadProjectTodos(projectId);
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleDeleteProject = async (projectId, projectName, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${projectName}"? This cannot be undone.`)) {
      try {
        await projectAPI.delete(projectId);
        alert('✅ Project deleted successfully!');
        const response = await projectAPI.getAll();
        const projectsData = response.data || response || [];
        setProjects(projectsData.map((project, index) => ({
          id: project.id,
          name: project.name,
          clientName: project.client_info?.full_name || 'Unknown Client',
          address: project.client_info?.address || '',
          status: 'Active',
          lastUpdated: new Date(project.updated_at).toLocaleDateString() || 'Unknown',
          createdDate: new Date(project.created_at).toLocaleDateString() || 'Unknown',
          color: PROJECT_COLORS[index % PROJECT_COLORS.length]
        })));
      } catch (error) {
        alert('❌ Failed to delete project: ' + error.message);
      }
    }
  };

  // Navigate to checklist with item highlighted
  const handleTodoClick = (projectId, itemId) => {
    if (itemId) {
      navigate(`/project/${projectId}?tab=Checklist&highlightItem=${itemId}`);
    } else {
      navigate(`/project/${projectId}?tab=Checklist`);
    }
  };

  const handleSendEmail = async () => {
    try {
      const BACKEND_URL = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
      const response = await fetch(`${BACKEND_URL}/api/send-questionnaire-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailData.email, name: emailData.name })
      });
      if (response.ok) {
        alert('✅ Questionnaire email sent successfully!');
        setShowEmailModal(false);
        setEmailData({ email: '', name: '' });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      alert(`Failed to send email: ${error.message}`);
    }
  };

  const sidebarItems = [
    { icon: '🏠', label: 'Walkthrough', path: projects[0] ? `/project/${projects[0].id}?tab=Walkthrough` : null },
    { icon: '📋', label: 'Checklist', path: projects[0] ? `/project/${projects[0].id}?tab=Checklist` : null },
    { icon: '📊', label: 'FF&E', path: projects[0] ? `/project/${projects[0].id}?tab=FF%26E` : null },
    { icon: '🧮', label: 'Calculators', path: '/calculators' },
    { icon: '👥', label: 'Contacts', path: '/master-contacts' },
    { icon: '📦', label: 'Materials', path: '/master-materials' },
    { icon: '✅', label: 'To-Do', path: '/master-todo' },
    { icon: '🤖', label: 'AI', path: '/ai-assistant' },
  ];

  return (
    <div className="min-h-screen bg-black flex">
      {/* SIDEBAR */}
      <div 
        className={`${sidebarCollapsed ? 'w-16' : 'w-20'} flex-shrink-0 flex flex-col transition-all duration-300`}
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
          borderRight: '1px solid #8b7355',
        }}
      >
        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-3 text-stone-400 hover:text-white hover:bg-[#8b7355]/20 transition-all"
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
        
        {/* Sidebar Nav Items */}
        <div className="flex-1 flex flex-col gap-1 p-2">
          {sidebarItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => item.path ? handleNavigation(item.path) : alert('No projects available')}
              className="flex flex-col items-center justify-center p-2 rounded-lg text-stone-400 hover:text-white hover:bg-[#8b7355]/30 transition-all"
              title={item.label}
            >
              <span className="text-xl">{item.icon}</span>
              {!sidebarCollapsed && <span className="text-[10px] mt-1">{item.label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="h-20 flex-shrink-0" style={{ 
          background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)',
        }}>
          <div className="flex items-center justify-center h-full px-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
              alt="ESTABLISHEDDESIGN CO." 
              className="h-12 object-contain"
              style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))' }}
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-center gap-3 py-3 bg-black/50 border-b border-[#8b7355]/30">
          <button 
            onClick={() => handleNavigation('/customer')}
            className="text-white px-5 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 100%)' }}
          >
            <span>+</span> New Client
          </button>
          <button 
            onClick={() => handleNavigation('/customer/questionnaire')}
            className="text-white px-5 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 100%)' }}
          >
            📋 Questionnaire
          </button>
          <button 
            onClick={() => setShowEmailModal(true)}
            className="text-white px-5 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 100%)' }}
          >
            📧 Email
          </button>
          <button 
            onClick={async () => {
              try {
                const BACKEND_URL = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
                const response = await fetch(`${BACKEND_URL}/api/backup/full`);
                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  a.remove();
                  alert('✅ Backup downloaded!');
                }
              } catch (error) {
                alert('❌ Backup failed: ' + error.message);
              }
            }}
            className="text-white px-5 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #2d5016 0%, #3d6b1f 100%)' }}
          >
            💾 Backup
          </button>
        </div>

        {/* MAIN AREA - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT SIDE - Projects + Calendar */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* PROJECTS GRID */}
            <div className="mb-6">
              <h2 className="text-lg text-stone-400 mb-3 flex items-center gap-2">
                📁 Projects <span className="text-xs bg-[#8b7355]/30 px-2 py-0.5 rounded">{projects.length}</span>
              </h2>
              
              {loading ? (
                <div className="text-stone-400 text-center py-8">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="text-stone-500 text-center py-8">
                  No projects yet. <button onClick={() => handleNavigation('/customer')} className="text-[#d4af37] underline">Create one</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {projects.map((project) => (
                    <div 
                      key={project.id}
                      onClick={() => handleProjectClick(project.id)}
                      className="rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                      style={{ border: `1px solid ${project.color.border}` }}
                    >
                      {/* Colored Header */}
                      <div 
                        className="px-3 py-2"
                        style={{ background: project.color.bg }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="text-white font-medium text-sm truncate">{project.name}</div>
                          <button
                            onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                            className="text-white/50 hover:text-white text-xs ml-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      {/* Body */}
                      <div className="p-3 bg-[#0f0f1a]">
                        <div className="text-stone-300 text-xs">{project.clientName}</div>
                        {project.address && (
                          <div className="text-stone-500 text-xs truncate mt-1">{project.address}</div>
                        )}
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}?tab=Walkthrough`); }}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#8b7355]/30 text-stone-300 hover:bg-[#8b7355]/50"
                          >
                            Walk
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}?tab=Checklist`); }}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#8b7355]/30 text-stone-300 hover:bg-[#8b7355]/50"
                          >
                            Check
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}?tab=FF%26E`); }}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#8b7355]/30 text-stone-300 hover:bg-[#8b7355]/50"
                          >
                            FF&E
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add New Project Card */}
                  <div 
                    onClick={() => handleNavigation('/customer')}
                    className="rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] border-2 border-dashed border-[#8b7355]/50 hover:border-[#8b7355] flex items-center justify-center min-h-[120px]"
                    style={{ background: 'rgba(139, 115, 85, 0.1)' }}
                  >
                    <div className="text-center">
                      <div className="text-3xl text-[#8b7355]">+</div>
                      <div className="text-xs text-stone-500 mt-1">New Project</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CALENDAR */}
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #8b7355' }}>
              <div className="px-3 py-2" style={{ background: 'linear-gradient(135deg, #5D4037 0%, #795548 100%)' }}>
                <h3 className="text-white font-medium text-sm">📅 Calendar</h3>
              </div>
              <div className="p-2 bg-[#0f0f1a]">
                <ProjectCalendar 
                  compact={true}
                  onEventClick={(event) => {
                    if (event.projectId) {
                      handleNavigation(`/project/${event.projectId}?tab=FF&E`);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - To-Do Lists */}
          <div className="w-80 xl:w-96 flex-shrink-0 overflow-y-auto p-4 border-l border-[#8b7355]/30">
            {/* COMPANY TO-DO */}
            <div className="rounded-lg overflow-hidden mb-4" style={{ border: '1px solid #7C3AED' }}>
              <div 
                className="px-3 py-2 flex justify-between items-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
              >
                <h3 className="text-white font-medium text-sm">🏢 Company Tasks</h3>
                <button
                  onClick={() => handleNavigation('/master-todo')}
                  className="text-white/70 hover:text-white text-xs"
                >
                  Edit →
                </button>
              </div>
              <div className="p-2 bg-[#0f0f1a] max-h-48 overflow-y-auto">
                {todosLoading ? (
                  <div className="text-stone-400 text-center py-2 text-sm">Loading...</div>
                ) : companyTodos.length === 0 ? (
                  <div className="text-stone-500 text-center py-2 text-sm">No company tasks</div>
                ) : (
                  <div className="space-y-1">
                    {companyTodos.map((todo) => (
                      <div 
                        key={todo.id}
                        className="flex items-start gap-2 p-2 rounded transition-all hover:bg-[#7C3AED]/10"
                      >
                        <button
                          onClick={() => toggleTodoComplete(todo.id, todo.completed, true)}
                          className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center text-xs ${
                            todo.completed 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-stone-500'
                          }`}
                        >
                          {todo.completed && '✓'}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs block ${todo.completed ? 'text-stone-500 line-through' : 'text-stone-300'}`}>
                            {todo.text}
                          </span>
                        </div>
                        {todo.priority === 'high' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">urgent</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* PROJECT TO-DOs - One section per project */}
            {projects.map((project) => (
              <div 
                key={project.id}
                className="rounded-lg overflow-hidden mb-4" 
                style={{ border: `1px solid ${project.color.border}` }}
              >
                <div 
                  className="px-3 py-2 flex justify-between items-center"
                  style={{ background: project.color.bg }}
                >
                  <h3 className="text-white font-medium text-sm truncate">📋 {project.name}</h3>
                  <button
                    onClick={() => navigate(`/project/${project.id}?tab=Checklist`)}
                    className="text-white/70 hover:text-white text-xs"
                  >
                    View →
                  </button>
                </div>
                <div className="p-2 bg-[#0f0f1a] max-h-40 overflow-y-auto">
                  {!projectTodos[project.id] || projectTodos[project.id].length === 0 ? (
                    <div className="text-stone-500 text-center py-2 text-xs">No tasks for this project</div>
                  ) : (
                    <div className="space-y-1">
                      {projectTodos[project.id].map((todo) => (
                        <div 
                          key={todo.id}
                          onClick={() => handleTodoClick(project.id, todo.item_id)}
                          className="flex items-start gap-2 p-2 rounded transition-all hover:bg-[#8b7355]/20 cursor-pointer"
                          title={todo.item_id ? "Click to view in Checklist" : ""}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTodoComplete(todo.id, todo.completed, false, project.id);
                            }}
                            className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center text-xs ${
                              todo.completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-stone-500'
                            }`}
                          >
                            {todo.completed && '✓'}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs block ${todo.completed ? 'text-stone-500 line-through' : 'text-stone-300'}`}>
                              {todo.text}
                            </span>
                            {todo.item_id && (
                              <span className="text-[10px] text-[#d4af37]">🔗 Linked to item</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div 
            className="rounded-lg p-6 w-full max-w-md"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
              border: '1px solid #8b7355',
            }}
          >
            <h3 className="text-xl text-[#D4C5A9] mb-4">Send Questionnaire Email</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-stone-400 text-sm mb-1">Client Name</label>
                <input
                  type="text"
                  value={emailData.name}
                  onChange={(e) => setEmailData({...emailData, name: e.target.value})}
                  className="w-full bg-black/50 border border-[#8b7355] rounded px-3 py-2 text-white"
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <label className="block text-stone-400 text-sm mb-1">Client Email</label>
                <input
                  type="email"
                  value={emailData.email}
                  onChange={(e) => setEmailData({...emailData, email: e.target.value})}
                  className="w-full bg-black/50 border border-[#8b7355] rounded px-3 py-2 text-white"
                  placeholder="Enter client email"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  className="px-4 py-2 rounded text-white"
                  style={{ background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 100%)' }}
                >
                  Send Questionnaire
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainDashboard;

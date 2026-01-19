import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { projectAPI } from '../App';
import ProjectCalendar from './ProjectCalendar';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const MainDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ email: '', name: '' });
  const [extensionData, setExtensionData] = useState(null);
  const [companyTodos, setCompanyTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTodoList, setShowTodoList] = useState(false);
  
  // Expandable section state - null means show all three, otherwise shows expanded section
  const [expandedSection, setExpandedSection] = useState(null); // 'files', 'todo', 'calendar', or null

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
        finish_image: searchParams.get('finish_image'), // CRITICAL: Swatch image
        vendor: searchParams.get('vendor'),
        link: searchParams.get('link'),
        image_url: searchParams.get('image'),
        msrp: searchParams.get('msrp')
      };
      console.log('📦 Extension data received:', data);
      setExtensionData(data);
      
      // Store in localStorage so FFE dashboard can access it
      localStorage.setItem('extensionScrapedData', JSON.stringify(data));
      
      // Show notification with finish info if available
      const finishInfo = data.finish_color ? `\nFinish: ${data.finish_color}` : '';
      alert(`✅ Product scraped!\n\nName: ${data.name}\nPrice: $${data.price || 'N/A'}${finishInfo}\n\nGo to any project's FF&E tab and click "Add Item" - the data will auto-populate!`);
      
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('🔄 Fetching projects from API...');
        const response = await projectAPI.getAll();
        console.log('📡 API Response:', response);
        
        // Handle both response.data and direct array response
        const projectsData = response.data || response || [];
        console.log('📊 Projects data:', projectsData);
        
        // Map the API response to the expected format
        const mappedProjects = projectsData.map(project => ({
          id: project.id,
          name: project.name,
          clientName: project.client_info?.full_name || 'Unknown Client',
          address: project.client_info?.address || '',
          status: 'Active',
          lastUpdated: new Date(project.updated_at).toLocaleDateString() || 'Unknown',
          createdDate: new Date(project.created_at).toLocaleDateString() || 'Unknown'
        }));
        
        console.log('✅ Mapped projects:', mappedProjects);
        setProjects(mappedProjects);
      } catch (error) {
        console.error('❌ Error fetching projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
    loadCompanyTodos();
  }, []);

  // Load company to-dos (PROTECTED - READ ONLY on dashboard)
  const loadCompanyTodos = async () => {
    setTodosLoading(true);
    try {
      const response = await axios.get(`${API_URL}/todos/company`);
      setCompanyTodos(response.data.todos || []);
    } catch (error) {
      console.error('Failed to load todos:', error);
      setCompanyTodos([]);
    } finally {
      setTodosLoading(false);
    }
  };

  // Toggle todo completion (SAFE operation)
  const toggleTodoComplete = async (todoId, currentStatus) => {
    try {
      await axios.put(`${API_URL}/todos/company/${todoId}`, {
        completed: !currentStatus
      });
      loadCompanyTodos(); // Refresh the list
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleProjectClick = (projectId) => {
    // Navigate to the project detail page with 4 tabs (Questionnaire, Walkthrough, Checklist, FF&E)
    navigate(`/project/${projectId}`);
  };

  const handleDeleteProject = async (projectId, projectName, e) => {
    e.stopPropagation(); // Prevent project selection when clicking delete
    
    if (!window.confirm(`Are you sure you want to delete "${projectName}"?\n\nThis will delete ALL rooms, items, and data. This cannot be undone!`)) {
      return;
    }
    
    try {
      await projectAPI.delete(projectId);
      alert('✅ Project deleted successfully!');
      // Refresh the projects list
      const response = await projectAPI.getAll();
      const projectsData = response.data || response || [];
      const mappedProjects = projectsData.map(project => ({
        id: project.id,
        name: project.name,
        clientName: project.client_info?.full_name || 'Unknown Client',
        address: project.client_info?.address || '',
        status: 'Active',
        lastUpdated: new Date(project.updated_at).toLocaleDateString() || 'Unknown',
        createdDate: new Date(project.created_at).toLocaleDateString() || 'Unknown'
      }));
      setProjects(mappedProjects);
    } catch (error) {
      alert('❌ Failed to delete project: ' + error.message);
      console.error('Delete error:', error);
    }
  };

  const handleSendEmail = async () => {
    try {
      const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
      const response = await fetch(`${BACKEND_URL}/api/send-questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_name: emailData.name,
          client_email: emailData.email,
          sender_name: 'Established Design Co.'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Success! Questionnaire email sent to ${emailData.name} at ${emailData.email}`);
        setShowEmailModal(false);
        setEmailData({ email: '', name: '' });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(`Failed to send email: ${error.message}`);
    }
  };


  return (
    <div className="min-h-screen bg-black">
      {/* Gold Header with Full-Width Logo */}
      <div className="w-full h-24" style={{ 
        background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
        boxShadow: '0 4px 20px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}>
        <div className="flex items-center justify-center h-full relative px-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
            alt="ESTABLISHEDDESIGN CO." 
            className="h-16 object-contain filter drop-shadow-lg"
            style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))' }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Top Action Buttons */}
        <div className="flex justify-center gap-3 mb-4">
          <button 
            onClick={() => handleNavigation('/customer')}
            className="text-white px-6 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3)',
            }}
          >
            <span>+</span>
            <span>New Client</span>
          </button>
          <button 
            onClick={() => setShowEmailModal(true)}
            className="text-white px-6 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3)',
            }}
          >
            <span>📧</span>
            <span>Email Client</span>
          </button>
          <button 
            onClick={() => handleNavigation('/customer/questionnaire')}
            className="text-white px-6 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3)',
            }}
          >
            <span>📋</span>
            <span>Questionnaire</span>
          </button>
          <button 
            onClick={async () => {
              try {
                const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);
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
            className="text-white px-6 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, #2d5016 0%, #3d6b1f 100%)`,
              boxShadow: '0 4px 15px rgba(45, 80, 22, 0.3)',
            }}
          >
            <span>💾</span>
            <span>Backup</span>
          </button>
        </div>

        {/* THREE-COLUMN LAYOUT - Customer Files | To-Do | Calendar */}
        <div className={`mx-auto mb-4 ${expandedSection ? 'max-w-6xl' : 'max-w-7xl'}`}>
          <div className={`grid gap-4 ${expandedSection ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
            
            {/* CUSTOMER FILES - Left Column */}
            {(!expandedSection || expandedSection === 'files') && (
              <div 
                className={`rounded-lg overflow-hidden ${expandedSection === 'files' ? 'col-span-1' : ''}`}
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
                  border: '1px solid #8b7355',
                  minHeight: expandedSection === 'files' ? '70vh' : '400px'
                }}
              >
                <div className="flex items-center justify-between p-3 border-b border-[#8b7355]/50">
                  <h3 className="text-lg font-medium text-[#D4C5A9] flex items-center gap-2">
                    📁 Customer Files
                    <span className="text-xs bg-[#8b7355]/30 px-2 py-0.5 rounded">{projects.length}</span>
                  </h3>
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'files' ? null : 'files')}
                    className="text-stone-400 hover:text-white px-2 py-1 rounded transition-all text-sm"
                    style={{ background: 'rgba(139, 115, 85, 0.2)' }}
                  >
                    {expandedSection === 'files' ? '⊟ Collapse' : '⊞ Expand'}
                  </button>
                </div>
                <div className={`p-3 overflow-y-auto ${expandedSection === 'files' ? 'max-h-[65vh]' : 'max-h-[340px]'}`}>
                  {loading ? (
                    <div className="text-stone-400 text-center py-4">Loading...</div>
                  ) : projects.length === 0 ? (
                    <div className="text-stone-500 text-center py-4">No projects yet</div>
                  ) : (
                    <div className="space-y-2">
                      {projects.map((project) => (
                        <div 
                          key={project.id}
                          onClick={() => handleProjectClick(project.id)}
                          className="p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02]"
                          style={{
                            background: 'linear-gradient(135deg, rgba(139, 115, 85, 0.15) 0%, rgba(139, 115, 85, 0.05) 100%)',
                            border: '1px solid rgba(139, 115, 85, 0.3)',
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-stone-200 font-medium">{project.name}</div>
                              <div className="text-stone-400 text-sm">{project.clientName}</div>
                              {project.address && (
                                <div className="text-stone-500 text-xs mt-1">{project.address}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <button
                                onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                                className="text-red-400/50 hover:text-red-400 text-sm"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          {expandedSection === 'files' && (
                            <div className="flex gap-2 mt-3 pt-2 border-t border-[#8b7355]/30">
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}?tab=Walkthrough`); }}
                                className="text-xs px-2 py-1 rounded bg-[#8b7355]/30 text-stone-300 hover:bg-[#8b7355]/50"
                              >
                                Walkthrough
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}?tab=Checklist`); }}
                                className="text-xs px-2 py-1 rounded bg-[#8b7355]/30 text-stone-300 hover:bg-[#8b7355]/50"
                              >
                                Checklist
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}?tab=FF%26E`); }}
                                className="text-xs px-2 py-1 rounded bg-[#8b7355]/30 text-stone-300 hover:bg-[#8b7355]/50"
                              >
                                FF&E
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TO-DO LIST - Center Column */}
            {(!expandedSection || expandedSection === 'todo') && (
              <div 
                className={`rounded-lg overflow-hidden ${expandedSection === 'todo' ? 'col-span-1' : ''}`}
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
                  border: '1px solid #8b7355',
                  minHeight: expandedSection === 'todo' ? '70vh' : '400px'
                }}
              >
                <div className="flex items-center justify-between p-3 border-b border-[#8b7355]/50">
                  <h3 className="text-lg font-medium text-[#D4C5A9] flex items-center gap-2">
                    ✅ To-Do List
                    <span className="text-xs bg-[#8b7355]/30 px-2 py-0.5 rounded">
                      {companyTodos.filter(t => !t.completed).length} active
                    </span>
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleNavigation('/master-todo')}
                      className="text-stone-400 hover:text-white px-2 py-1 rounded transition-all text-sm"
                      style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
                    >
                      📝 Edit
                    </button>
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'todo' ? null : 'todo')}
                      className="text-stone-400 hover:text-white px-2 py-1 rounded transition-all text-sm"
                      style={{ background: 'rgba(139, 115, 85, 0.2)' }}
                    >
                      {expandedSection === 'todo' ? '⊟ Collapse' : '⊞ Expand'}
                    </button>
                  </div>
                </div>
                <div className={`p-3 overflow-y-auto ${expandedSection === 'todo' ? 'max-h-[65vh]' : 'max-h-[340px]'}`}>
                  {todosLoading ? (
                    <div className="text-stone-400 text-center py-4">Loading...</div>
                  ) : companyTodos.length === 0 ? (
                    <div className="text-stone-500 text-center py-4">No to-do items</div>
                  ) : (
                    <div className="space-y-2">
                      {companyTodos.map((todo) => (
                        <div 
                          key={todo.id}
                          className="flex items-start gap-3 p-2 rounded-lg transition-all"
                          style={{
                            background: todo.completed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 115, 85, 0.1)',
                            border: `1px solid ${todo.completed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(139, 115, 85, 0.3)'}`,
                          }}
                        >
                          <button
                            onClick={() => toggleTodoComplete(todo.id, todo.completed)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              todo.completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-stone-500 hover:border-stone-400'
                            }`}
                          >
                            {todo.completed && '✓'}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm block ${todo.completed ? 'text-stone-500 line-through' : 'text-stone-300'}`}>
                              {todo.text}
                            </span>
                            {todo.deadline && (
                              <span className="text-xs text-stone-500">
                                📅 {new Date(todo.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {todo.priority && (
                            <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                              todo.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              todo.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-stone-500/20 text-stone-400'
                            }`}>
                              {todo.priority}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CALENDAR - Right Column */}
            {(!expandedSection || expandedSection === 'calendar') && (
              <div 
                className={`rounded-lg overflow-hidden ${expandedSection === 'calendar' ? 'col-span-1' : ''}`}
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
                  border: '1px solid #8b7355',
                  minHeight: expandedSection === 'calendar' ? '70vh' : '400px'
                }}
              >
                <div className="flex items-center justify-between p-3 border-b border-[#8b7355]/50">
                  <h3 className="text-lg font-medium text-[#D4C5A9] flex items-center gap-2">
                    📅 Calendar
                  </h3>
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'calendar' ? null : 'calendar')}
                    className="text-stone-400 hover:text-white px-2 py-1 rounded transition-all text-sm"
                    style={{ background: 'rgba(139, 115, 85, 0.2)' }}
                  >
                    {expandedSection === 'calendar' ? '⊟ Collapse' : '⊞ Expand'}
                  </button>
                </div>
                <div className={`p-2 overflow-hidden ${expandedSection === 'calendar' ? '' : ''}`}>
                  <ProjectCalendar 
                    compact={expandedSection !== 'calendar'}
                    onEventClick={(event) => {
                      if (event.projectId) {
                        handleNavigation(`/project/${event.projectId}?tab=FF&E`);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Icons */}
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center gap-2 flex-wrap">
            {[
              { icon: '🏠', label: 'Walk', path: projects[0] ? `/project/${projects[0].id}?tab=Walkthrough` : null },
              { icon: '📋', label: 'Check', path: projects[0] ? `/project/${projects[0].id}?tab=Checklist` : null },
              { icon: '📊', label: 'FF&E', path: projects[0] ? `/project/${projects[0].id}?tab=FF%26E` : null },
              { icon: '🧮', label: 'Calc', path: '/calculators' },
              { icon: '👥', label: 'Contacts', path: '/master-contacts' },
              { icon: '📦', label: 'Materials', path: '/master-materials' },
              { icon: '🤖', label: 'AI', path: '/ai-assistant' },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => item.path ? handleNavigation(item.path) : alert('No projects available')}
                className="text-stone-400 hover:text-white p-2 rounded-lg transition-all hover:bg-[#8b7355]/20"
                style={{ border: '1px solid rgba(139, 115, 85, 0.3)' }}
              >
                <div className="text-lg">{item.icon}</div>
                <div className="text-xs">{item.label}</div>
              </button>
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
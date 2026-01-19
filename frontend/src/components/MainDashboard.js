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
  const [showCalendar, setShowCalendar] = useState(true);
  const [showTodoList, setShowTodoList] = useState(true);
  const [companyTodos, setCompanyTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(false);

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
      <div className="w-full h-32" style={{ 
        background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
        boxShadow: '0 4px 20px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}>
        <div className="flex items-center justify-center h-full relative px-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 animate-pulse"></div>
          <img 
            src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" 
            alt="ESTABLISHEDDESIGN CO." 
            className="w-full h-20 object-contain filter drop-shadow-lg"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.2))',
              maxWidth: '100%'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-transparent to-yellow-400 opacity-5 animate-pulse"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-12">
        {/* Navigation Links at Top - COMPACT GRID */}
        <div className="max-w-6xl mx-auto mb-6 grid grid-cols-4 md:grid-cols-8 gap-2">
          <button
            onClick={() => projects.length > 0 ? handleNavigation(`/project/${projects[0].id}?tab=Walkthrough`) : alert('No projects available')}
            className="text-stone-300 p-2 rounded-lg transition-all duration-200 hover:border-[#d4af37]"
            style={{
              background: `linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)`,
              border: '1px solid #8b7355',
            }}
          >
            <div className="text-lg">🏠</div>
            <div className="text-xs">Walkthrough</div>
          </button>
          
          <button
            onClick={() => projects.length > 0 ? handleNavigation(`/project/${projects[0].id}?tab=Checklist`) : alert('No projects available')}
            className="text-stone-300 p-2 rounded-lg transition-all duration-200 hover:border-[#d4af37]"
            style={{
              background: `linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)`,
              border: '1px solid #8b7355',
            }}
          >
            <div className="text-lg">📋</div>
            <div className="text-xs">Checklist</div>
          </button>
          
          <button
            onClick={() => projects.length > 0 ? handleNavigation(`/project/${projects[0].id}?tab=FF&E`) : alert('No projects available')}
            className="text-stone-300 p-2 rounded-lg transition-all duration-200 hover:border-[#d4af37]"
            style={{
              background: `linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)`,
              border: '1px solid #8b7355',
            }}
          >
            <div className="text-lg">📊</div>
            <div className="text-xs">FF&E</div>
          </button>

          <button
            onClick={() => handleNavigation('/calculators')}
            className="text-stone-300 p-2 rounded-lg transition-all duration-200 hover:border-[#d4af37]"
            style={{
              background: `linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)`,
              border: '1px solid #8b7355',
            }}
          >
            <div className="text-lg">🧮</div>
            <div className="text-xs">Calculators</div>
          </button>

          <button
            onClick={() => handleNavigation('/master-contacts')}
            className="text-stone-300 p-2 rounded-lg transition-all duration-200 hover:border-[#d4af37]"
            style={{
              background: `linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)`,
              border: '1px solid #8b7355',
            }}
          >
            <div className="text-lg">👥</div>
            <div className="text-xs">Contacts</div>
          </button>

          <button
            onClick={() => handleNavigation('/master-materials')}
            className="text-stone-300 p-2 rounded-lg transition-all duration-200 hover:border-[#d4af37]"
            style={{
              background: `linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)`,
              border: '1px solid #8b7355',
            }}
          >
            <div className="text-lg">📦</div>
            <div className="text-xs">Materials</div>
          </button>

          <button
            onClick={() => handleNavigation('/master-todo')}
            className="text-stone-300 p-2 rounded-lg transition-all duration-200 hover:border-[#d4af37]"
            style={{
              background: `linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)`,
              border: '1px solid #8b7355',
            }}
          >
            <div className="text-lg">✅</div>
            <div className="text-xs">To-Do</div>
          </button>

          <button
            onClick={() => handleNavigation('/ai-assistant')}
            className="text-stone-300 p-2 rounded-lg transition-all duration-200 hover:border-[#d4af37]"
            style={{
              background: `linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)`,
              border: '1px solid #8b7355',
            }}
          >
            <div className="text-lg">🤖</div>
            <div className="text-xs">AI</div>
          </button>
        </div>

        {/* Three Main Action Buttons - FULL SIZE */}
        <div className="flex justify-center space-x-4 mb-8">
          <button 
            onClick={() => handleNavigation('/customer')}
            className="text-white px-8 py-3 rounded-full font-medium transition-all duration-200 flex items-center space-x-2"
            style={{
              background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.3))'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(139, 115, 85, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
          >
            <span>+</span>
            <span>New Client</span>
          </button>
          <button 
            onClick={() => setShowEmailModal(true)}
            className="text-white px-8 py-3 rounded-full font-medium transition-all duration-200 flex items-center space-x-2"
            style={{
              background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.3))'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(139, 115, 85, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
          >
            <span>📧</span>
            <span>Email New Client</span>
          </button>
          <button 
            onClick={() => handleNavigation('/customer/questionnaire')}
            className="text-white px-8 py-3 rounded-full font-medium transition-all duration-200 flex items-center space-x-2"
            style={{
              background: `linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)`,
              boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.3))'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(139, 115, 85, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
          >
            <span>📋</span>
            <span>Full Questionnaire</span>
          </button>
          <button 
            onClick={async () => {
              try {
                const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;
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
                  alert('✅ Backup downloaded! Upload this file to Google Drive for safekeeping.');
                } else {
                  throw new Error('Backup failed');
                }
              } catch (error) {
                alert('❌ Backup failed: ' + error.message);
              }
            }}
            className="text-white px-8 py-3 rounded-full font-medium transition-all duration-200 flex items-center space-x-2"
            style={{
              background: `linear-gradient(135deg, #2d5016 0%, #3d6b1f 50%, #2d5016 100%)`,
              boxShadow: '0 4px 15px rgba(45, 80, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              filter: 'drop-shadow(0 0 5px rgba(61, 107, 31, 0.3))'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(45, 80, 22, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(45, 80, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
          >
            <span>💾</span>
            <span>Backup Data</span>
          </button>
        </div>

        {/* MAIN CALENDAR SECTION */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-light text-stone-400">Project Calendar</h2>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="text-stone-400 hover:text-white px-4 py-2 rounded-lg transition-all"
              style={{
                background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)',
                border: '1px solid #8b7355',
              }}
            >
              {showCalendar ? '▼ Hide Calendar' : '▶ Show Calendar'}
            </button>
          </div>
          {showCalendar && (
            <ProjectCalendar 
              onEventClick={(event) => {
                if (event.projectId) {
                  handleNavigation(`/project/${event.projectId}?tab=FF&E`);
                }
              }}
            />
          )}
        </div>

        {/* MASTER TO-DO LIST SECTION - READ ONLY VIEW (Protected) */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-light text-stone-400">Master To-Do List</h2>
              <span className="text-xs text-stone-500 bg-stone-800 px-2 py-1 rounded">
                {companyTodos.filter(t => !t.completed).length} active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavigation('/master-todo')}
                className="text-stone-400 hover:text-white px-3 py-2 rounded-lg transition-all text-sm"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  border: '1px solid #8B5CF6',
                }}
              >
                📝 Edit Full List
              </button>
              <button
                onClick={() => setShowTodoList(!showTodoList)}
                className="text-stone-400 hover:text-white px-4 py-2 rounded-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)',
                  border: '1px solid #8b7355',
                }}
              >
                {showTodoList ? '▼ Hide To-Do' : '▶ Show To-Do'}
              </button>
            </div>
          </div>
          {showTodoList && (
            <div 
              className="rounded-lg p-4"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
                border: '1px solid #8b7355',
              }}
            >
              {todosLoading ? (
                <div className="text-stone-400 text-center py-4">Loading to-dos...</div>
              ) : companyTodos.length === 0 ? (
                <div className="text-stone-500 text-center py-4">No to-do items yet. Click "Edit Full List" to add items.</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {companyTodos.slice(0, 10).map((todo) => (
                    <div 
                      key={todo.id}
                      className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-stone-800/50"
                      style={{
                        background: todo.completed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 115, 85, 0.1)',
                        border: `1px solid ${todo.completed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(139, 115, 85, 0.3)'}`,
                      }}
                    >
                      <button
                        onClick={() => toggleTodoComplete(todo.id, todo.completed)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          todo.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-stone-500 hover:border-stone-400'
                        }`}
                      >
                        {todo.completed && '✓'}
                      </button>
                      <div className="flex-1">
                        <span className={`text-sm ${todo.completed ? 'text-stone-500 line-through' : 'text-stone-300'}`}>
                          {todo.text}
                        </span>
                        {todo.deadline && (
                          <span className="ml-2 text-xs text-stone-500">
                            📅 {new Date(todo.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {todo.priority && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          todo.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          todo.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-stone-500/20 text-stone-400'
                        }`}>
                          {todo.priority}
                        </span>
                      )}
                    </div>
                  ))}
                  {companyTodos.length > 10 && (
                    <button
                      onClick={() => handleNavigation('/master-todo')}
                      className="w-full text-center text-sm text-stone-400 hover:text-white py-2"
                    >
                      View all {companyTodos.length} items →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Studio Projects Title - Moved Below */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-light text-stone-400 mb-2">Studio Projects</h2>
          <div className="w-16 h-px bg-stone-600 mx-auto"></div>
        </div>

        {/* Project Cards */}
        <div className="max-w-4xl mx-auto space-y-4">
          {!loading && projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className="rounded-lg p-6 cursor-pointer transition-all duration-200"
              style={{
                background: `linear-gradient(135deg, #000000 0%, #0a0a1a 30%, #1a1a2e 60%, #0a0a1a 100%)`,
                border: '1px solid #8b7355',
                boxShadow: '0 4px 15px rgba(139, 115, 85, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = '#d4af37';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 115, 85, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = '#8b7355';
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl text-stone-300 font-medium">{project.name}</h3>
                  <button
                    onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                    className="text-red-400 hover:text-red-300 transition-colors duration-200 text-sm"
                    title="Delete Project"
                  >
                    🗑️
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-stone-500">Last Updated</span>
                  <div className="w-4 h-4 bg-stone-600 rounded"></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-stone-500">Client:</span>
                    <span className="text-sm text-stone-300">{project.clientName}</span>
                  </div>
                  {project.address && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-stone-500">Address:</span>
                      <span className="text-sm text-stone-300">{project.address}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-right space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-stone-300">{project.status}</span>
                  </div>
                  <div className="text-sm text-stone-500">Created {project.createdDate}</div>
                </div>
              </div>
              
              {/* Project Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/walkthrough/${project.id}`);
                  }}
                  className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs transition-colors duration-200"
                >
                  Walkthrough
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/checklist/${project.id}`);
                  }}
                  className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs transition-colors duration-200"
                >
                  Checklist
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/ffe/${project.id}`);
                  }}
                  className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs transition-colors duration-200"
                >
                  FF&E
                </button>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="text-center text-stone-400 py-8">
              <p className="text-lg">Loading projects...</p>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Email Client Questionnaire</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={emailData.name}
                  onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter client name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailData.email}
                  onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!emailData.email || !emailData.name}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
              >
                Send Questionnaire
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainDashboard;
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * MasterToDoList - A unified view of ALL to-dos across all projects and company-wide
 * Includes:
 * - Company-wide to-dos (Established Design Co internal tasks)
 * - Per-project to-dos organized by customer/project
 * - Punch list items integrated as to-dos
 */
export default function MasterToDoList() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [projectTodos, setProjectTodos] = useState({});
  const [projectPunchItems, setProjectPunchItems] = useState({});
  const [companyTodos, setCompanyTodos] = useState([]);
  const [activeSection, setActiveSection] = useState('all'); // all, company, projects
  const [expandedProjects, setExpandedProjects] = useState({});
  
  // New item form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodo, setNewTodo] = useState({
    text: '',
    priority: 'Medium',
    type: 'company', // company or project
    project_id: null
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load all projects
      const projectsRes = await axios.get(`${API_URL}/projects`);
      const projectsList = projectsRes.data.projects || [];
      setProjects(projectsList);
      
      // Initialize expanded state
      const expanded = {};
      projectsList.forEach(p => { expanded[p.id] = true; });
      setExpandedProjects(expanded);
      
      // Load todos and punch items for each project
      const todosMap = {};
      const punchMap = {};
      
      for (const project of projectsList) {
        try {
          // Load project todos
          const todosRes = await axios.get(`${API_URL}/todos/${project.id}`);
          todosMap[project.id] = todosRes.data.todos || [];
        } catch (e) {
          todosMap[project.id] = [];
        }
        
        try {
          // Load punch list items
          const punchRes = await fetch(`${API_URL}/punch-list/project/${project.id}`);
          if (punchRes.ok) {
            const punchData = await punchRes.json();
            punchMap[project.id] = punchData.punch_items || [];
          } else {
            punchMap[project.id] = [];
          }
        } catch (e) {
          punchMap[project.id] = [];
        }
      }
      
      setProjectTodos(todosMap);
      setProjectPunchItems(punchMap);
      
      // Load company-wide todos
      try {
        const companyRes = await axios.get(`${API_URL}/todos/company`);
        setCompanyTodos(companyRes.data.todos || []);
      } catch (e) {
        setCompanyTodos([]);
      }
      
    } catch (error) {
      console.error('Failed to load master todo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodo.text.trim()) return;
    
    try {
      if (newTodo.type === 'company') {
        // Add company-wide todo
        await axios.post(`${API_URL}/todos/company`, {
          text: newTodo.text.trim(),
          priority: newTodo.priority,
          completed: false
        });
      } else {
        // Add project-specific todo
        await axios.post(`${API_URL}/todos`, {
          project_id: newTodo.project_id,
          text: newTodo.text.trim(),
          priority: newTodo.priority,
          completed: false
        });
      }
      
      setNewTodo({ text: '', priority: 'Medium', type: 'company', project_id: null });
      setShowAddForm(false);
      await loadAllData();
    } catch (error) {
      alert('Failed to add to-do: ' + error.message);
    }
  };

  const toggleTodo = async (todoId, completed, isCompany = false) => {
    try {
      const endpoint = isCompany ? `${API_URL}/todos/company/${todoId}` : `${API_URL}/todos/${todoId}`;
      await axios.put(endpoint, { completed: !completed });
      await loadAllData();
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const togglePunchItem = async (itemId, currentStatus, projectId) => {
    try {
      const nextStatus = {
        pending: 'in_progress',
        in_progress: 'completed',
        completed: 'verified',
        verified: 'pending'
      };
      await fetch(`${API_URL}/punch-list/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus[currentStatus] || 'in_progress' })
      });
      await loadAllData();
    } catch (error) {
      console.error('Failed to toggle punch item:', error);
    }
  };

  const deleteTodo = async (todoId, isCompany = false) => {
    if (!window.confirm('Delete this to-do?')) return;
    try {
      const endpoint = isCompany ? `${API_URL}/todos/company/${todoId}` : `${API_URL}/todos/${todoId}`;
      await axios.delete(endpoint);
      await loadAllData();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      High: { bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', border: '#EF4444', shadow: '#EF444450' },
      Medium: { bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', border: '#F59E0B', shadow: '#F59E0B50' },
      Low: { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: '#10B981', shadow: '#10B98150' },
      urgent: { bg: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)', border: '#DC2626', shadow: '#DC262650' },
      high: { bg: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', border: '#F97316', shadow: '#F9731650' },
      medium: { bg: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)', border: '#FBBF24', shadow: '#FBBF2450' },
      low: { bg: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)', border: '#6B7280', shadow: '#6B728050' }
    };
    return styles[priority] || styles.Medium;
  };

  const getStatusIcon = (status) => {
    const icons = { pending: '⏳', in_progress: '🔄', completed: '✅', verified: '✓✓' };
    return icons[status] || '⏳';
  };

  const toggleProjectExpanded = (projectId) => {
    setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  // Calculate totals
  const totalCompanyTodos = companyTodos.length;
  const totalProjectTodos = Object.values(projectTodos).flat().length;
  const totalPunchItems = Object.values(projectPunchItems).flat().length;
  const totalAll = totalCompanyTodos + totalProjectTodos + totalPunchItems;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F172A' }}>
        <div className="text-[#D4A574] text-2xl">Loading Master To-Do List...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      <div className="p-6 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#D4A574] mb-2">📋 Master To-Do List</h1>
          <p className="text-gray-400">All tasks across company and projects in one place</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div 
            className={`p-4 rounded-xl border cursor-pointer transition-all ${activeSection === 'all' ? 'border-[#D4A574] bg-[#D4A574]/10' : 'border-[#B49B7E]/30'}`}
            onClick={() => setActiveSection('all')}
          >
            <div className="text-3xl font-bold text-white">{totalAll}</div>
            <div className="text-sm text-gray-400">All Tasks</div>
          </div>
          <div 
            className={`p-4 rounded-xl border cursor-pointer transition-all ${activeSection === 'company' ? 'border-purple-500 bg-purple-500/10' : 'border-[#B49B7E]/30'}`}
            onClick={() => setActiveSection('company')}
          >
            <div className="text-3xl font-bold text-purple-400">{totalCompanyTodos}</div>
            <div className="text-sm text-gray-400">Company Tasks</div>
          </div>
          <div 
            className={`p-4 rounded-xl border cursor-pointer transition-all ${activeSection === 'projects' ? 'border-blue-500 bg-blue-500/10' : 'border-[#B49B7E]/30'}`}
            onClick={() => setActiveSection('projects')}
          >
            <div className="text-3xl font-bold text-blue-400">{totalProjectTodos}</div>
            <div className="text-sm text-gray-400">Project To-Dos</div>
          </div>
          <div 
            className={`p-4 rounded-xl border cursor-pointer transition-all ${activeSection === 'punch' ? 'border-orange-500 bg-orange-500/10' : 'border-[#B49B7E]/30'}`}
            onClick={() => setActiveSection('punch')}
          >
            <div className="text-3xl font-bold text-orange-400">{totalPunchItems}</div>
            <div className="text-sm text-gray-400">Punch List Items</div>
          </div>
        </div>

        {/* Add New Task Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 rounded-lg font-bold border-2 border-[#D4A574] text-black"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #B49B7E 50%, #D4A574 100%)',
              boxShadow: '0 0 20px rgba(212, 165, 116, 0.4)'
            }}
          >
            {showAddForm ? '✕ Cancel' : '➕ Add New Task'}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-6 p-6 rounded-xl border border-[#B49B7E]/30" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 100%)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <select
                value={newTodo.type}
                onChange={(e) => setNewTodo(prev => ({ ...prev, type: e.target.value, project_id: null }))}
                className="px-4 py-3 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
              >
                <option value="company">🏢 Established Design Co (Company)</option>
                <option value="project">👤 Project-Specific</option>
              </select>
              
              {newTodo.type === 'project' && (
                <select
                  value={newTodo.project_id || ''}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, project_id: e.target.value }))}
                  className="px-4 py-3 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                >
                  <option value="">Select Project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.client_info?.name || 'No Client'}</option>
                  ))}
                </select>
              )}
              
              <select
                value={newTodo.priority}
                onChange={(e) => setNewTodo(prev => ({ ...prev, priority: e.target.value }))}
                className="px-4 py-3 rounded-lg border-2 text-white font-bold"
                style={{
                  background: getPriorityStyle(newTodo.priority).bg,
                  borderColor: getPriorityStyle(newTodo.priority).border
                }}
              >
                <option value="High">🔴 High Priority</option>
                <option value="Medium">🟡 Medium Priority</option>
                <option value="Low">🟢 Low Priority</option>
              </select>
            </div>
            
            <div className="flex gap-4">
              <input
                type="text"
                value={newTodo.text}
                onChange={(e) => setNewTodo(prev => ({ ...prev, text: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="What needs to be done?"
                className="flex-1 px-4 py-3 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500"
              />
              <button
                onClick={addTodo}
                disabled={!newTodo.text.trim() || (newTodo.type === 'project' && !newTodo.project_id)}
                className="px-8 py-3 rounded-lg font-bold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                ➕ Add
              </button>
            </div>
          </div>
        )}

        {/* COMPANY TO-DOS SECTION */}
        {(activeSection === 'all' || activeSection === 'company') && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-t-xl" 
                 style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}>
              <span className="text-2xl">🏢</span>
              <h2 className="text-xl font-bold text-white">Established Design Co</h2>
              <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm text-white">
                {companyTodos.length} tasks
              </span>
            </div>
            
            <div className="border border-purple-500/30 border-t-0 rounded-b-xl overflow-hidden">
              {companyTodos.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No company tasks yet</div>
              ) : (
                companyTodos.map(todo => (
                  <div key={todo.id} className="p-4 border-b border-purple-500/10 last:border-b-0 hover:bg-purple-500/5 flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id, todo.completed, true)}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: getPriorityStyle(todo.priority).bg }}
                    >
                      {todo.priority}
                    </span>
                    <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                      {todo.text}
                    </span>
                    <button onClick={() => deleteTodo(todo.id, true)} className="text-red-400 hover:text-red-300">🗑️</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PROJECT TO-DOS & PUNCH LISTS */}
        {(activeSection === 'all' || activeSection === 'projects' || activeSection === 'punch') && projects.map(project => {
          const todos = projectTodos[project.id] || [];
          const punchItems = projectPunchItems[project.id] || [];
          const showTodos = activeSection === 'all' || activeSection === 'projects';
          const showPunch = activeSection === 'all' || activeSection === 'punch';
          
          if (!showTodos && !showPunch) return null;
          if (showTodos && todos.length === 0 && showPunch && punchItems.length === 0) return null;
          if (!showTodos && punchItems.length === 0) return null;
          if (!showPunch && todos.length === 0) return null;
          
          return (
            <div key={project.id} className="mb-6">
              {/* Project Header */}
              <div 
                className="flex items-center gap-3 px-4 py-3 rounded-t-xl cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)' }}
                onClick={() => toggleProjectExpanded(project.id)}
              >
                <span className="text-xl">{expandedProjects[project.id] ? '▼' : '▶'}</span>
                <span className="text-2xl">👤</span>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">{project.name}</h2>
                  <p className="text-sm text-blue-200">{project.client_info?.name || 'No Client'}</p>
                </div>
                <div className="flex gap-2">
                  {showTodos && todos.length > 0 && (
                    <span className="bg-blue-400/20 px-3 py-1 rounded-full text-sm text-blue-200">
                      {todos.length} to-dos
                    </span>
                  )}
                  {showPunch && punchItems.length > 0 && (
                    <span className="bg-orange-400/20 px-3 py-1 rounded-full text-sm text-orange-200">
                      {punchItems.length} punch
                    </span>
                  )}
                </div>
              </div>
              
              {expandedProjects[project.id] && (
                <div className="border border-blue-500/30 border-t-0 rounded-b-xl overflow-hidden">
                  {/* Project To-Dos */}
                  {showTodos && todos.length > 0 && (
                    <div className="border-b border-blue-500/20">
                      <div className="px-4 py-2 bg-blue-900/30 text-blue-300 text-sm font-semibold">
                        📋 To-Do Items
                      </div>
                      {todos.map(todo => (
                        <div key={todo.id} className="p-4 border-b border-blue-500/10 last:border-b-0 hover:bg-blue-500/5 flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => toggleTodo(todo.id, todo.completed, false)}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-bold text-white"
                            style={{ background: getPriorityStyle(todo.priority).bg }}
                          >
                            {todo.priority}
                          </span>
                          <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                            {todo.text}
                          </span>
                          <button onClick={() => deleteTodo(todo.id, false)} className="text-red-400 hover:text-red-300">🗑️</button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Punch List Items */}
                  {showPunch && punchItems.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-orange-900/30 text-orange-300 text-sm font-semibold">
                        🔨 Punch List Items
                      </div>
                      {punchItems.map(item => (
                        <div key={item.id} className="p-4 border-b border-orange-500/10 last:border-b-0 hover:bg-orange-500/5 flex items-center gap-4">
                          <button
                            onClick={() => togglePunchItem(item.id, item.status, project.id)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                              item.status === 'completed' || item.status === 'verified'
                                ? 'border-green-500 bg-green-500/20 text-green-400'
                                : 'border-orange-500 hover:border-orange-400'
                            }`}
                          >
                            {getStatusIcon(item.status)}
                          </button>
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-bold text-white"
                            style={{ background: getPriorityStyle(item.priority).bg }}
                          >
                            {item.priority}
                          </span>
                          <div className="flex-1">
                            <span className={`${item.status === 'completed' || item.status === 'verified' ? 'line-through text-gray-500' : 'text-white'}`}>
                              {item.title}
                            </span>
                            {item.description && (
                              <p className="text-gray-500 text-sm">{item.description}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{item.status.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {todos.length === 0 && punchItems.length === 0 && (
                    <div className="p-6 text-center text-gray-500">No tasks for this project</div>
                  )}
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}

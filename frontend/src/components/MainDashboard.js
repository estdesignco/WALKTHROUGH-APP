import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { projectAPI } from '../App';
import ProjectCalendar from './ProjectCalendar';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

// Project colors for headers - each project gets a unique color
const PROJECT_COLORS = [
  { bg: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)', border: '#CD853F', name: 'Saddle Brown', accent: '#DEB887' },
  { bg: 'linear-gradient(135deg, #2F4F4F 0%, #3D5C5C 100%)', border: '#5F9EA0', name: 'Dark Slate', accent: '#87CEEB' },
  { bg: 'linear-gradient(135deg, #4A3728 0%, #5D4037 100%)', border: '#8D6E63', name: 'Coffee', accent: '#D7CCC8' },
  { bg: 'linear-gradient(135deg, #1C3A4B 0%, #2C5364 100%)', border: '#4682B4', name: 'Steel Blue', accent: '#87CEEB' },
  { bg: 'linear-gradient(135deg, #3E2723 0%, #4E342E 100%)', border: '#795548', name: 'Espresso', accent: '#BCAAA4' },
  { bg: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)', border: '#5C6BC0', name: 'Indigo', accent: '#9FA8DA' },
  { bg: 'linear-gradient(135deg, #004D40 0%, #00695C 100%)', border: '#26A69A', name: 'Teal', accent: '#80CBC4' },
  { bg: 'linear-gradient(135deg, #BF360C 0%, #E64A19 100%)', border: '#FF7043', name: 'Deep Orange', accent: '#FFAB91' },
];

// Priority colors matching original To-Do list
const getPriorityColor = (priority) => {
  const colors = {
    low: 'bg-gray-600', Low: 'bg-gray-600',
    medium: 'bg-cyan-600', Medium: 'bg-cyan-600',
    high: 'bg-orange-600', High: 'bg-orange-600',
    urgent: 'bg-red-600'
  };
  return colors[priority] || 'bg-gray-600';
};

const getStatusIcon = (status, completed) => {
  if (completed) return '✅';
  const icons = { pending: '⏳', in_progress: '🔄', completed: '✅', verified: '✓✓' };
  return icons[status] || '⏳';
};

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
  
  // To-Do Modal State
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [todoModalSection, setTodoModalSection] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodo, setNewTodo] = useState({
    text: '', description: '', priority: 'medium', assigned_to: '', deadline: ''
  });

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
      alert(`✅ Product scraped!\n\nName: ${data.name}\nPrice: $${data.price || 'N/A'}`);
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
          color: PROJECT_COLORS[index % PROJECT_COLORS.length]
        }));
        setProjects(mappedProjects);
        for (const project of mappedProjects) {
          loadProjectTodos(project.id);
        }
      } catch (error) {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
    loadCompanyTodos();
  }, []);

  const loadCompanyTodos = async () => {
    try {
      const response = await axios.get(`${API_URL}/todos/company`);
      setCompanyTodos(response.data.todos || []);
    } catch (error) {
      setCompanyTodos([]);
    }
  };

  const loadProjectTodos = async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/todos/${projectId}`);
      setProjectTodos(prev => ({ ...prev, [projectId]: response.data.todos || [] }));
    } catch (error) {}
  };

  const updateTodoStatus = async (todoId, newStatus, isCompany = true, projectId = null) => {
    try {
      const endpoint = isCompany ? `${API_URL}/todos/company/${todoId}` : `${API_URL}/todos/${projectId}/${todoId}`;
      await axios.put(endpoint, { status: newStatus, completed: newStatus === 'completed' });
      if (isCompany) loadCompanyTodos(); else loadProjectTodos(projectId);
    } catch (error) {}
  };

  const createTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.text.trim()) return;
    try {
      await axios.post(`${API_URL}/todos/company`, {
        text: newTodo.text.trim(),
        description: newTodo.description,
        priority: newTodo.priority,
        assigned_to: newTodo.assigned_to,
        deadline: newTodo.deadline || null,
        status: 'pending',
        completed: false
      });
      setNewTodo({ text: '', description: '', priority: 'medium', assigned_to: '', deadline: '' });
      setShowAddForm(false);
      loadCompanyTodos();
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  };

  const deleteTodo = async (todoId, isCompany = true, projectId = null) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const endpoint = isCompany ? `${API_URL}/todos/company/${todoId}` : `${API_URL}/todos/${projectId}/${todoId}`;
      await axios.delete(endpoint);
      if (isCompany) loadCompanyTodos(); else loadProjectTodos(projectId);
    } catch (error) {}
  };

  const handleNavigation = (path) => navigate(path);
  const handleProjectClick = (projectId) => navigate(`/project/${projectId}`);

  const handleDeleteProject = async (projectId, projectName, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${projectName}"?`)) {
      try {
        await projectAPI.delete(projectId);
        const response = await projectAPI.getAll();
        const projectsData = response.data || response || [];
        setProjects(projectsData.map((project, index) => ({
          id: project.id, name: project.name,
          clientName: project.client_info?.full_name || 'Unknown Client',
          address: project.client_info?.address || '',
          color: PROJECT_COLORS[index % PROJECT_COLORS.length]
        })));
      } catch (error) {
        alert('Failed: ' + error.message);
      }
    }
  };

  const handleTodoClick = (projectId, itemId, sourceType = 'checklist') => {
    const tabParam = sourceType === 'ffe' ? 'FF%26E' : sourceType === 'walkthrough' ? 'Walkthrough' : 'Checklist';
    navigate(`/project/${projectId}?tab=${tabParam}${itemId ? `&highlightItem=${itemId}` : ''}`);
  };

  const handleSendEmail = async () => {
    try {
      const BACKEND_URL = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
      const response = await fetch(`${BACKEND_URL}/api/send-questionnaire-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailData.email, name: emailData.name })
      });
      if (response.ok) {
        alert('✅ Email sent!');
        setShowEmailModal(false);
        setEmailData({ email: '', name: '' });
      }
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  };

  const sidebarItems = [
    { icon: '🏠', label: 'Walk', path: projects[0] ? `/project/${projects[0].id}?tab=Walkthrough` : null },
    { icon: '📋', label: 'Check', path: projects[0] ? `/project/${projects[0].id}?tab=Checklist` : null },
    { icon: '📊', label: 'FF&E', path: projects[0] ? `/project/${projects[0].id}?tab=FF%26E` : null },
    { icon: '🧮', label: 'Calc', path: '/calculators' },
    { icon: '👥', label: 'Contacts', path: '/master-contacts' },
    { icon: '📦', label: 'Materials', path: '/master-materials' },
    { icon: '✅', label: 'To-Do', action: () => setShowTodoModal(true) },
    { icon: '🤖', label: 'AI', path: '/ai-assistant' },
  ];

  const renderTodoItem = (todo, isCompany, projectId = null) => {
    const linkedItem = todo.linked_ffe_item || todo.linked_checklist_item || {};
    const sourceType = todo.source_type || linkedItem.source_type || 'checklist';
    const sheetLabel = sourceType === 'ffe' ? 'FF&E' : sourceType === 'walkthrough' ? 'WALKTHROUGH' : 'CHECKLIST';
    const roomName = linkedItem.room_name || linkedItem.room || todo.room_name || '';
    const categoryName = linkedItem.category_name || linkedItem.category || '';
    
    return (
      <div key={todo.id} className={`p-2 rounded-lg transition-all hover:bg-black/30 ${todo.completed ? 'opacity-60' : ''}`} style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-start gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextStatus = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' };
              updateTodoStatus(todo.id, nextStatus[todo.status || 'pending'], isCompany, projectId);
            }}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs ${
              todo.completed || todo.status === 'completed' ? 'border-green-500 bg-green-500/20 text-green-400'
                : todo.status === 'in_progress' ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                : 'border-gray-500 hover:border-[#D4A574]'
            }`}
          >
            {getStatusIcon(todo.status, todo.completed)}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className={`text-xs font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-white'}`}>{todo.text}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${getPriorityColor(todo.priority)} text-white`}>{todo.priority}</span>
            </div>
            {(roomName || categoryName) && (
              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                {roomName && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#8b7355]/30 text-[#D4A574]">{roomName}</span>}
                {categoryName && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">{categoryName}</span>}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-500 flex-wrap">
              {todo.assigned_to && <span>👤 {todo.assigned_to}</span>}
              {todo.deadline && <span className="text-amber-400">📅 {new Date(todo.deadline).toLocaleDateString()}</span>}
              {!isCompany && todo.item_id && (
                <button onClick={(e) => { e.stopPropagation(); handleTodoClick(projectId, todo.item_id, sourceType); }}
                  className="px-1.5 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-500">{sheetLabel} →</button>
              )}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id, isCompany, projectId); }}
            className="text-red-400/50 hover:text-red-400 text-xs flex-shrink-0">🗑️</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* SIDEBAR */}
      <div className="w-16 flex-shrink-0 flex flex-col" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)', borderRight: '1px solid #8b7355' }}>
        <div className="flex-1 flex flex-col gap-1 p-1 pt-4">
          {sidebarItems.map((item, idx) => (
            <button key={idx} onClick={() => item.action ? item.action() : (item.path ? handleNavigation(item.path) : null)}
              className="flex flex-col items-center justify-center p-2 rounded-lg text-stone-400 hover:text-white hover:bg-[#8b7355]/30" title={item.label}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-[9px] mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="h-16 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)' }}>
          <div className="flex items-center justify-between h-full px-4">
            <img src="https://customer-assets.emergentagent.com/job_sleek-showcase-46/artifacts/c5c84fh5_Established%20logo.png" alt="ESTABLISHEDDESIGN CO." className="h-10 object-contain" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))' }} />
            <div className="flex gap-2">
              <button onClick={() => handleNavigation('/customer')} className="text-white px-4 py-1.5 rounded-full text-xs font-medium hover:scale-105" style={{ background: 'rgba(0,0,0,0.3)' }}>+ New Client</button>
              <button onClick={() => handleNavigation('/customer/questionnaire')} className="text-white px-4 py-1.5 rounded-full text-xs font-medium hover:scale-105" style={{ background: 'rgba(0,0,0,0.3)' }}>📋 Quest</button>
              <button onClick={() => setShowEmailModal(true)} className="text-white px-4 py-1.5 rounded-full text-xs font-medium hover:scale-105" style={{ background: 'rgba(0,0,0,0.3)' }}>📧 Email</button>
              <button onClick={async () => {
                try {
                  const BACKEND_URL = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
                  const response = await fetch(`${BACKEND_URL}/api/backup/full`);
                  if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url;
                    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a); a.click();
                    window.URL.revokeObjectURL(url); a.remove();
                    alert('✅ Backup downloaded!');
                  }
                } catch (error) { alert('Failed: ' + error.message); }
              }} className="text-white px-4 py-1.5 rounded-full text-xs font-medium hover:scale-105" style={{ background: 'rgba(45, 80, 22, 0.6)' }}>💾 Backup</button>
            </div>
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT - Projects + Calendar */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <h2 className="text-sm text-stone-400 mb-2">📁 Projects ({projects.length})</h2>
              {loading ? <div className="text-stone-400 text-center py-8">Loading...</div> : projects.length === 0 ? (
                <div className="text-stone-500 text-center py-8">No projects. <button onClick={() => handleNavigation('/customer')} className="text-[#d4af37] underline">Create one</button></div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                  {projects.map((project) => (
                    <div key={project.id} onClick={() => handleProjectClick(project.id)} className="rounded-lg overflow-hidden cursor-pointer hover:scale-[1.02]" style={{ border: `1px solid ${project.color.border}` }}>
                      <div className="px-2 py-1.5" style={{ background: project.color.bg }}>
                        <div className="flex justify-between items-center">
                          <div className="text-white font-medium text-xs truncate">{project.name}</div>
                          <button onClick={(e) => handleDeleteProject(project.id, project.name, e)} className="text-white/50 hover:text-white text-xs ml-1">×</button>
                        </div>
                      </div>
                      <div className="p-2 bg-[#0f0f1a]">
                        <div className="text-stone-300 text-[10px]">{project.clientName}</div>
                        <div className="flex gap-1 mt-1.5">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}?tab=Walkthrough`); }} className="text-[9px] px-1.5 py-0.5 rounded bg-[#8b7355]/30 text-stone-300 hover:bg-[#8b7355]/50">Walk</button>
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}?tab=Checklist`); }} className="text-[9px] px-1.5 py-0.5 rounded bg-[#8b7355]/30 text-stone-300 hover:bg-[#8b7355]/50">Check</button>
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}?tab=FF%26E`); }} className="text-[9px] px-1.5 py-0.5 rounded bg-[#8b7355]/30 text-stone-300 hover:bg-[#8b7355]/50">FF&E</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div onClick={() => handleNavigation('/customer')} className="rounded-lg cursor-pointer hover:scale-[1.02] border border-dashed border-[#8b7355]/50 hover:border-[#8b7355] flex items-center justify-center min-h-[80px]" style={{ background: 'rgba(139, 115, 85, 0.1)' }}>
                    <div className="text-center"><div className="text-2xl text-[#8b7355]">+</div><div className="text-[9px] text-stone-500">New</div></div>
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #5D4037' }}>
              <div className="px-3 py-2" style={{ background: 'linear-gradient(135deg, #5D4037 0%, #795548 100%)' }}><h3 className="text-white font-medium text-xs">📅 Calendar</h3></div>
              <div className="p-2 bg-[#0f0f1a]"><ProjectCalendar compact={true} onEventClick={(event) => { if (event.projectId) handleNavigation(`/project/${event.projectId}?tab=FF&E`); }} /></div>
            </div>
          </div>

          {/* RIGHT - To-Do Lists */}
          <div className="w-72 xl:w-80 flex-shrink-0 overflow-y-auto p-3 border-l border-[#8b7355]/30">
            {/* COMPANY TO-DO */}
            <div className="rounded-lg overflow-hidden mb-3" style={{ border: '1px solid #7C3AED' }}>
              <div className="px-3 py-2 flex justify-between items-center cursor-pointer" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }} onClick={() => { setShowTodoModal(true); setTodoModalSection('company'); }}>
                <h3 className="text-white font-medium text-xs">🏢 Company Tasks</h3>
                <span className="text-white/70 text-[10px]">{companyTodos.filter(t => !t.completed).length}</span>
              </div>
              <div className="bg-[#0f0f1a] max-h-44 overflow-y-auto">
                {companyTodos.length === 0 ? <div className="text-stone-500 text-center py-3 text-xs">No company tasks</div> : (
                  <div className="p-2 space-y-1">
                    {companyTodos.slice(0, 5).map((todo) => renderTodoItem(todo, true))}
                    {companyTodos.length > 5 && <button onClick={() => { setShowTodoModal(true); setTodoModalSection('company'); }} className="w-full text-center text-[10px] text-[#D4A574] py-1">View all {companyTodos.length} →</button>}
                  </div>
                )}
              </div>
            </div>
            {/* PROJECT TO-DOs */}
            {projects.map((project) => {
              const todos = projectTodos[project.id] || [];
              if (todos.length === 0) return null;
              return (
                <div key={project.id} className="rounded-lg overflow-hidden mb-3" style={{ border: `1px solid ${project.color.border}` }}>
                  <div className="px-3 py-2 flex justify-between items-center cursor-pointer" style={{ background: project.color.bg }} onClick={() => { setShowTodoModal(true); setTodoModalSection('projects'); }}>
                    <h3 className="text-white font-medium text-xs truncate">📋 {project.name}</h3>
                    <span className="text-white/70 text-[10px]">{todos.filter(t => !t.completed).length}</span>
                  </div>
                  <div className="bg-[#0f0f1a] max-h-36 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {todos.slice(0, 3).map((todo) => renderTodoItem(todo, false, project.id))}
                      {todos.length > 3 && <button onClick={() => handleNavigation(`/project/${project.id}?tab=Checklist`)} className="w-full text-center text-[10px] text-[#D4A574] py-1">View all {todos.length} →</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TO-DO MODAL */}
      {showTodoModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)', border: '1px solid #8b7355' }}>
            <div className="px-6 py-4 border-b border-[#8b7355]/30 flex items-center justify-between">
              <div><h2 className="text-2xl font-bold text-[#D4A574]">Master To-Do List</h2><p className="text-gray-400 text-sm">{companyTodos.filter(t => !t.completed).length + Object.values(projectTodos).flat().filter(t => !t.completed).length} pending</p></div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowAddForm(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm">+ Add Task</button>
                <button onClick={() => setShowTodoModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
              </div>
            </div>
            <div className="flex border-b border-[#8b7355]/30">
              {['all', 'company', 'projects'].map(section => (
                <button key={section} onClick={() => setTodoModalSection(section)} className={`flex-1 px-4 py-3 text-sm font-medium ${todoModalSection === section ? 'text-[#D4A574] border-b-2 border-[#D4A574] bg-[#D4A574]/10' : 'text-gray-500 hover:text-gray-300'}`}>
                  {section === 'all' ? '📋 All' : section === 'company' ? '🏢 Company' : '🏠 Projects'}
                </button>
              ))}
            </div>
            {showAddForm && (
              <div className="p-4 border-b border-[#8b7355]/30 bg-black/30">
                <form onSubmit={createTodo} className="space-y-3">
                  <input type="text" value={newTodo.text} onChange={(e) => setNewTodo(prev => ({ ...prev, text: e.target.value }))} placeholder="What needs to be done?" className="w-full px-4 py-3 rounded-lg bg-black/50 border border-[#8b7355]/30 text-white placeholder-gray-500" autoFocus required />
                  <div className="flex gap-3 flex-wrap">
                    <select value={newTodo.priority} onChange={(e) => setNewTodo(prev => ({ ...prev, priority: e.target.value }))} className="px-4 py-2 rounded-lg bg-black/50 border border-[#8b7355]/30 text-white">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                    </select>
                    <input type="text" value={newTodo.assigned_to} onChange={(e) => setNewTodo(prev => ({ ...prev, assigned_to: e.target.value }))} placeholder="Assign to" className="flex-1 px-4 py-2 rounded-lg bg-black/50 border border-[#8b7355]/30 text-white placeholder-gray-500" />
                    <input type="date" value={newTodo.deadline} onChange={(e) => setNewTodo(prev => ({ ...prev, deadline: e.target.value }))} className="px-4 py-2 rounded-lg bg-black/50 border border-[#8b7355]/30 text-white" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm">Add Task</button>
                    <button type="button" onClick={() => setShowAddForm(false)} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(todoModalSection === 'all' || todoModalSection === 'company') && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #7C3AED' }}>
                  <div className="px-4 py-3" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}><h3 className="text-white font-bold">🏢 Company Tasks</h3></div>
                  <div className="p-3 space-y-2 bg-[#0f0f1a]/50">
                    {companyTodos.length === 0 ? <p className="text-gray-500 text-center py-4">No company tasks</p> : companyTodos.map((todo) => renderTodoItem(todo, true))}
                  </div>
                </div>
              )}
              {(todoModalSection === 'all' || todoModalSection === 'projects') && projects.map((project) => {
                const todos = projectTodos[project.id] || [];
                return (
                  <div key={project.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${project.color.border}` }}>
                    <div className="px-4 py-3" style={{ background: project.color.bg }}><h3 className="text-white font-bold">🏠 {project.name}</h3></div>
                    <div className="p-3 space-y-2 bg-[#0f0f1a]/50">
                      {todos.length === 0 ? <p className="text-gray-500 text-center py-4">No tasks</p> : todos.map((todo) => renderTodoItem(todo, false, project.id))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 w-full max-w-md" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)', border: '1px solid #8b7355' }}>
            <h3 className="text-xl text-[#D4C5A9] mb-4">Send Questionnaire Email</h3>
            <div className="space-y-4">
              <div><label className="block text-stone-400 text-sm mb-1">Client Name</label><input type="text" value={emailData.name} onChange={(e) => setEmailData({...emailData, name: e.target.value})} className="w-full bg-black/50 border border-[#8b7355] rounded px-3 py-2 text-white" placeholder="Enter client name" /></div>
              <div><label className="block text-stone-400 text-sm mb-1">Client Email</label><input type="email" value={emailData.email} onChange={(e) => setEmailData({...emailData, email: e.target.value})} className="w-full bg-black/50 border border-[#8b7355] rounded px-3 py-2 text-white" placeholder="Enter client email" /></div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowEmailModal(false)} className="px-4 py-2 rounded text-stone-400 hover:text-white">Cancel</button>
                <button onClick={handleSendEmail} className="px-4 py-2 rounded text-white" style={{ background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 100%)' }}>Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const JOB_COLORS = [
  { bg: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)', border: '#CD853F', accent: '#DEB887' },
  { bg: 'linear-gradient(135deg, #2F4F4F 0%, #3D5C5C 100%)', border: '#5F9EA0', accent: '#87CEEB' },
  { bg: 'linear-gradient(135deg, #4A0E4E 0%, #6B1D6B 100%)', border: '#9932CC', accent: '#DA70D6' },
  { bg: 'linear-gradient(135deg, #1C3D1C 0%, #2D5A2D 100%)', border: '#228B22', accent: '#90EE90' },
  { bg: 'linear-gradient(135deg, #4A2C2A 0%, #6B3D3B 100%)', border: '#A0522D', accent: '#F4A460' },
  { bg: 'linear-gradient(135deg, #1A3A5C 0%, #2A5080 100%)', border: '#4682B4', accent: '#87CEEB' },
];

export default function MasterToDoList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [projectTodos, setProjectTodos] = useState({});
  const [projectPunchItems, setProjectPunchItems] = useState({});
  const [companyTodos, setCompanyTodos] = useState([]);
  const [activeSection, setActiveSection] = useState('all');
  const [expandedProjects, setExpandedProjects] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodo, setNewTodo] = useState({ text: '', priority: 'Medium', type: 'company', project_id: null });

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const projectsRes = await axios.get(`${API_URL}/projects`);
      const projectsList = projectsRes.data.projects || projectsRes.data || [];
      setProjects(projectsList);
      const expanded = {};
      projectsList.forEach(p => { expanded[p.id] = true; });
      setExpandedProjects(expanded);
      
      const todosMap = {}, punchMap = {};
      for (const project of projectsList) {
        try {
          const todosRes = await axios.get(`${API_URL}/todos/${project.id}`);
          todosMap[project.id] = todosRes.data.todos || [];
        } catch (e) { todosMap[project.id] = []; }
        try {
          const punchRes = await fetch(`${API_URL}/punch-list/project/${project.id}`);
          if (punchRes.ok) {
            const punchData = await punchRes.json();
            punchMap[project.id] = punchData.punch_items || [];
          } else { punchMap[project.id] = []; }
        } catch (e) { punchMap[project.id] = []; }
      }
      setProjectTodos(todosMap);
      setProjectPunchItems(punchMap);
      try {
        const companyRes = await axios.get(`${API_URL}/todos/company`);
        setCompanyTodos(companyRes.data.todos || []);
      } catch (e) { setCompanyTodos([]); }
    } catch (error) { console.error('Failed to load:', error); }
    finally { setLoading(false); }
  };

  const addTodo = async () => {
    if (!newTodo.text.trim()) return;
    try {
      if (newTodo.type === 'company') {
        await axios.post(`${API_URL}/todos/company`, { text: newTodo.text.trim(), priority: newTodo.priority, completed: false });
      } else {
        await axios.post(`${API_URL}/todos`, { project_id: newTodo.project_id, text: newTodo.text.trim(), priority: newTodo.priority, completed: false });
      }
      setNewTodo({ text: '', priority: 'Medium', type: 'company', project_id: null });
      setShowAddForm(false);
      await loadAllData();
    } catch (error) { alert('Failed: ' + error.message); }
  };

  const toggleTodo = async (todoId, completed, isCompany = false) => {
    try {
      const endpoint = isCompany ? `${API_URL}/todos/company/${todoId}` : `${API_URL}/todos/${todoId}`;
      await axios.put(endpoint, { completed: !completed });
      await loadAllData();
    } catch (error) { console.error('Failed:', error); }
  };

  const togglePunchItem = async (itemId, currentStatus) => {
    try {
      const nextStatus = { pending: 'in_progress', in_progress: 'completed', completed: 'verified', verified: 'pending' };
      await fetch(`${API_URL}/punch-list/${itemId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus[currentStatus] || 'in_progress' }) });
      await loadAllData();
    } catch (error) { console.error('Failed:', error); }
  };

  const deleteTodo = async (todoId, isCompany = false) => {
    if (!window.confirm('Delete?')) return;
    try {
      const endpoint = isCompany ? `${API_URL}/todos/company/${todoId}` : `${API_URL}/todos/${todoId}`;
      await axios.delete(endpoint);
      await loadAllData();
    } catch (error) { console.error('Failed:', error); }
  };

  const getPriorityStyle = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'high' || p === 'urgent') return '#DC2626';
    if (p === 'low') return '#059669';
    return '#D97706';
  };

  const getStatusIcon = (status) => ({ pending: '⏳', in_progress: '🔄', completed: '✅', verified: '✓✓' }[status] || '⏳');
  const toggleProjectExpanded = (projectId) => { setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] })); };

  const totalCompanyTodos = companyTodos.length;
  const totalProjectTodos = Object.values(projectTodos).flat().length;
  const totalPunchItems = Object.values(projectPunchItems).flat().length;
  const totalAll = totalCompanyTodos + totalProjectTodos + totalPunchItems;

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F172A' }}><div className="text-[#D4A574] text-2xl">Loading...</div></div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      <div className="p-6 max-w-6xl mx-auto">
        <button onClick={() => navigate('/')} className="mb-4 px-4 py-2 rounded-lg text-[#D4A574] hover:text-white flex items-center gap-2" style={{ background: 'linear-gradient(135deg, rgba(139, 115, 85, 0.3) 0%, rgba(160, 132, 92, 0.2) 100%)', border: '1px solid #B49B7E' }}>← Back to Dashboard</button>
        <div className="mb-8"><h1 className="text-4xl font-bold text-[#D4A574] mb-2">Master To-Do List</h1><p className="text-[#B49B7E]">All tasks across company and jobs</p></div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[['all', totalAll, 'All'], ['company', totalCompanyTodos, 'Company'], ['todos', totalProjectTodos, 'Job To-Dos'], ['punch', totalPunchItems, 'Punch List']].map(([key, count, label]) => (
            <div key={key} className={`p-4 rounded-xl cursor-pointer ${activeSection === key ? 'ring-2 ring-[#D4A574]' : ''}`} style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid #B49B7E' }} onClick={() => setActiveSection(key)}>
              <div className="text-3xl font-bold text-[#D4A574]">{count}</div>
              <div className="text-sm text-[#B49B7E]">{label}</div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <button onClick={() => setShowAddForm(!showAddForm)} className="px-6 py-3 rounded-lg font-bold text-black" style={{ background: 'linear-gradient(135deg, #D4A574 0%, #B49B7E 100%)', border: '2px solid #D4A574' }}>{showAddForm ? '✕ Cancel' : '+ Add New Task'}</button>
        </div>

        {showAddForm && (
          <div className="mb-6 p-6 rounded-xl" style={{ background: 'rgba(0,0,0,0.9)', border: '1px solid #B49B7E' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <select value={newTodo.type} onChange={(e) => setNewTodo(prev => ({ ...prev, type: e.target.value, project_id: null }))} className="px-4 py-3 rounded-lg text-[#D4C5A9]" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #B49B7E' }}>
                <option value="company">Established Design Co</option><option value="project">Job-Specific</option>
              </select>
              {newTodo.type === 'project' && (
                <select value={newTodo.project_id || ''} onChange={(e) => setNewTodo(prev => ({ ...prev, project_id: e.target.value }))} className="px-4 py-3 rounded-lg text-[#D4C5A9]" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #B49B7E' }}>
                  <option value="">Select Job...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
              <select value={newTodo.priority} onChange={(e) => setNewTodo(prev => ({ ...prev, priority: e.target.value }))} className="px-4 py-3 rounded-lg text-white font-bold" style={{ background: getPriorityStyle(newTodo.priority) }}>
                <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
              </select>
            </div>
            <div className="flex gap-4">
              <input type="text" value={newTodo.text} onChange={(e) => setNewTodo(prev => ({ ...prev, text: e.target.value }))} onKeyPress={(e) => e.key === 'Enter' && addTodo()} placeholder="What needs to be done?" className="flex-1 px-4 py-3 rounded-lg text-[#D4C5A9] placeholder-[#B49B7E]/50" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #B49B7E' }} />
              <button onClick={addTodo} disabled={!newTodo.text.trim() || (newTodo.type === 'project' && !newTodo.project_id)} className="px-8 py-3 rounded-lg font-bold text-white disabled:opacity-50" style={{ background: '#059669' }}>+ Add</button>
            </div>
          </div>
        )}

        {(activeSection === 'all' || activeSection === 'company') && (
          <div className="mb-8">
            <div className="flex items-center gap-3 px-4 py-3 rounded-t-xl" style={{ background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 100%)', border: '1px solid #D4A574' }}>
              <span className="text-2xl">🏢</span><h2 className="text-xl font-bold text-white">Established Design Co</h2>
              <span className="ml-auto bg-black/30 px-3 py-1 rounded-full text-sm text-white">{companyTodos.length} tasks</span>
            </div>
            <div className="rounded-b-xl overflow-hidden" style={{ border: '1px solid #B49B7E', borderTop: 'none' }}>
              {companyTodos.length === 0 ? <div className="p-6 text-center text-[#B49B7E]" style={{ background: 'rgba(0,0,0,0.8)' }}>No company tasks yet</div> : companyTodos.map((todo, idx) => (
                <div key={todo.id} className="p-4 flex items-center gap-4" style={{ background: idx % 2 === 0 ? 'rgba(0,0,0,0.8)' : 'rgba(30,30,30,0.8)', borderBottom: '1px solid #B49B7E30' }}>
                  <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id, todo.completed, true)} className="w-5 h-5" />
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: getPriorityStyle(todo.priority) }}>{todo.priority}</span>
                  <span className={`flex-1 ${todo.completed ? 'line-through text-[#B49B7E]/50' : 'text-[#D4C5A9]'}`}>{todo.text}</span>
                  <button onClick={() => deleteTodo(todo.id, true)} className="text-red-400">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeSection === 'all' || activeSection === 'todos' || activeSection === 'punch') && projects.map((project, projectIndex) => {
          const todos = projectTodos[project.id] || [];
          const punchItems = projectPunchItems[project.id] || [];
          const showTodos = activeSection === 'all' || activeSection === 'todos';
          const showPunch = activeSection === 'all' || activeSection === 'punch';
          const hasTodos = showTodos && todos.length > 0;
          const hasPunch = showPunch && punchItems.length > 0;
          if (!hasTodos && !hasPunch) return null;
          const jobColor = JOB_COLORS[projectIndex % JOB_COLORS.length];
          
          return (
            <div key={project.id} className="mb-6">
              <div className="flex items-center gap-3 px-4 py-3 rounded-t-xl cursor-pointer" style={{ background: jobColor.bg, border: `1px solid ${jobColor.border}` }} onClick={() => toggleProjectExpanded(project.id)}>
                <span className="text-xl text-white">{expandedProjects[project.id] ? '▼' : '▶'}</span>
                <div className="flex-1"><h2 className="text-lg font-bold text-white">JOB: {project.name}</h2><p className="text-sm" style={{ color: jobColor.accent }}>{project.client_info?.name || 'No Client'}</p></div>
                <div className="flex gap-2">
                  {hasTodos && <span className="bg-black/30 px-3 py-1 rounded-full text-sm text-white font-bold">📋 {todos.length}</span>}
                  {hasPunch && <span className="bg-black/30 px-3 py-1 rounded-full text-sm text-white font-bold">🔨 {punchItems.length}</span>}
                </div>
              </div>
              {expandedProjects[project.id] && (
                <div className="rounded-b-xl overflow-hidden" style={{ border: `1px solid ${jobColor.border}`, borderTop: 'none' }}>
                  {hasTodos && (
                    <div className={hasPunch ? 'border-b-2' : ''} style={{ borderColor: jobColor.border }}>
                      <div className="px-4 py-2 text-sm font-bold text-white" style={{ background: 'rgba(0,0,0,0.5)' }}>📋 TO-DO LIST</div>
                      {todos.map((todo, idx) => (
                        <div key={todo.id} className="p-4 flex items-center gap-4" style={{ background: idx % 2 === 0 ? 'rgba(0,0,0,0.8)' : 'rgba(30,30,30,0.8)' }}>
                          <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id, todo.completed, false)} className="w-5 h-5" />
                          <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: getPriorityStyle(todo.priority) }}>{todo.priority}</span>
                          <span className={`flex-1 ${todo.completed ? 'line-through text-[#B49B7E]/50' : 'text-[#D4C5A9]'}`}>{todo.text}</span>
                          {todo.linked_ffe_item && <span className="text-xs px-2 py-1 rounded" style={{ background: jobColor.border + '30', color: jobColor.accent }}>🔗 {todo.linked_ffe_item.name}</span>}
                          <button onClick={() => deleteTodo(todo.id, false)} className="text-red-400">🗑️</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {hasPunch && (
                    <div>
                      <div className="px-4 py-2 text-sm font-bold text-white" style={{ background: 'rgba(0,0,0,0.5)' }}>🔨 PUNCH LIST</div>
                      {punchItems.map((item, idx) => (
                        <div key={item.id} className="p-4 flex items-center gap-4" style={{ background: idx % 2 === 0 ? 'rgba(0,0,0,0.8)' : 'rgba(30,30,30,0.8)' }}>
                          <button onClick={() => togglePunchItem(item.id, item.status)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${item.status === 'completed' || item.status === 'verified' ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-[#D4A574] text-[#D4A574]'}`}>{getStatusIcon(item.status)}</button>
                          <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: getPriorityStyle(item.priority) }}>{item.priority}</span>
                          <div className="flex-1"><span className={item.status === 'completed' || item.status === 'verified' ? 'line-through text-[#B49B7E]/50' : 'text-[#D4C5A9]'}>{item.title}</span>{item.description && <p className="text-[#B49B7E]/70 text-sm mt-1">{item.description}</p>}</div>
                          <span className="text-xs text-[#B49B7E] uppercase">{(item.status || 'pending').replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {totalAll === 0 && <div className="text-center py-12"><div className="text-6xl mb-4">📋</div><div className="text-xl text-[#D4A574]">No tasks yet</div><div className="text-[#B49B7E] mt-2">Add tasks above or from within each job</div></div>}
      </div>
    </div>
  );
}

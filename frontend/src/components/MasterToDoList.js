import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

// TONED DOWN project colors - much more subtle
const JOB_COLORS = [
  { bg: 'linear-gradient(135deg, rgba(139, 69, 19, 0.15) 0%, rgba(160, 82, 45, 0.12) 100%)', border: 'rgba(205, 133, 63, 0.4)', accent: '#DEB887' },
  { bg: 'linear-gradient(135deg, rgba(47, 79, 79, 0.15) 0%, rgba(61, 92, 92, 0.12) 100%)', border: 'rgba(95, 158, 160, 0.4)', accent: '#87CEEB' },
  { bg: 'linear-gradient(135deg, rgba(74, 14, 78, 0.15) 0%, rgba(107, 29, 107, 0.12) 100%)', border: 'rgba(153, 50, 204, 0.4)', accent: '#DA70D6' },
  { bg: 'linear-gradient(135deg, rgba(28, 61, 28, 0.15) 0%, rgba(45, 90, 45, 0.12) 100%)', border: 'rgba(34, 139, 34, 0.4)', accent: '#90EE90' },
  { bg: 'linear-gradient(135deg, rgba(74, 44, 42, 0.15) 0%, rgba(107, 61, 59, 0.12) 100%)', border: 'rgba(160, 82, 45, 0.4)', accent: '#F4A460' },
  { bg: 'linear-gradient(135deg, rgba(26, 58, 92, 0.15) 0%, rgba(42, 80, 128, 0.12) 100%)', border: 'rgba(70, 130, 180, 0.4)', accent: '#87CEEB' },
];

/**
 * MasterToDoList - Aggregates all to-dos and punch items across projects
 * Company To-Do section rebuilt to match PunchList interface per user request
 */
export default function MasterToDoList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [projectTodos, setProjectTodos] = useState({});
  const [projectPunchItems, setProjectPunchItems] = useState({});
  const [companyTodos, setCompanyTodos] = useState([]);
  const [activeSection, setActiveSection] = useState('all');
  const [expandedProjects, setExpandedProjects] = useState({});
  
  // Company To-Do form state - MATCHING PUNCHLIST
  const [showCompanyAddForm, setShowCompanyAddForm] = useState(false);
  const [companyFilter, setCompanyFilter] = useState('all');
  const [newCompanyTodo, setNewCompanyTodo] = useState({
    text: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    deadline: ''
  });

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

  // Create company to-do - MATCHING PUNCHLIST interface
  const createCompanyTodo = async (e) => {
    e.preventDefault();
    if (!newCompanyTodo.text.trim()) return;
    
    try {
      await axios.post(`${API_URL}/todos/company`, {
        text: newCompanyTodo.text.trim(),
        description: newCompanyTodo.description,
        priority: newCompanyTodo.priority,
        assigned_to: newCompanyTodo.assigned_to,
        deadline: newCompanyTodo.deadline || null,
        status: 'pending',
        completed: false
      });
      
      setNewCompanyTodo({ text: '', description: '', priority: 'medium', assigned_to: '', deadline: '' });
      setShowCompanyAddForm(false);
      await loadAllData();
    } catch (error) {
      alert('Failed to create: ' + error.message);
    }
  };

  const toggleTodo = async (todoId, completed, isCompany = false) => {
    try {
      const endpoint = isCompany ? `${API_URL}/todos/company/${todoId}` : `${API_URL}/todos/${todoId}`;
      // Set BOTH completed AND status to ensure proper tracking
      const newCompleted = !completed;
      await axios.put(endpoint, { 
        completed: newCompleted,
        status: newCompleted ? 'completed' : 'pending'
      });
      await loadAllData();
    } catch (error) { console.error('Failed:', error); }
  };

  const updateCompanyTodoStatus = async (todoId, newStatus) => {
    try {
      const newCompleted = newStatus === 'completed';
      await axios.put(`${API_URL}/todos/company/${todoId}`, { 
        status: newStatus,
        completed: newCompleted
      });
      await loadAllData();
    } catch (error) { console.error('Failed:', error); }
  };

  const updateCompanyTodoPriority = async (todoId, newPriority) => {
    try {
      await axios.put(`${API_URL}/todos/company/${todoId}`, { 
        priority: newPriority
      });
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
    if (!window.confirm('Delete this item?')) return;
    try {
      const endpoint = isCompany ? `${API_URL}/todos/company/${todoId}` : `${API_URL}/todos/${todoId}`;
      await axios.delete(endpoint);
      await loadAllData();
    } catch (error) { console.error('Failed:', error); }
  };

  const deletePunchItem = async (itemId) => {
    if (!window.confirm('Delete this punch item?')) return;
    try {
      await fetch(`${API_URL}/punch-list/${itemId}`, { method: 'DELETE' });
      await loadAllData();
    } catch (error) { console.error('Failed:', error); }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-600', Low: 'bg-gray-600',
      medium: 'bg-cyan-600', Medium: 'bg-cyan-600',  // CHANGED from yellow to cyan
      high: 'bg-orange-600', High: 'bg-orange-600',
      urgent: 'bg-red-600'
    };
    return colors[priority] || 'bg-gray-600';
  };

  const getStatusColor = (status, completed) => {
    if (completed) return 'text-green-400';
    const colors = { pending: 'text-gray-400', in_progress: 'text-blue-400', completed: 'text-green-400', verified: 'text-purple-400' };
    return colors[status] || 'text-gray-400';
  };

  const getStatusIcon = (status, completed) => {
    if (completed) return '✅';
    const icons = { pending: '⏳', in_progress: '🔄', completed: '✅', verified: '✓✓' };
    return icons[status] || '⏳';
  };

  // Filter company todos
  const filteredCompanyTodos = companyTodos.filter(todo => {
    if (companyFilter === 'all') return true;
    if (companyFilter === 'completed') return todo.completed || todo.status === 'completed';
    if (companyFilter === 'pending') return !todo.completed && todo.status !== 'completed' && todo.status !== 'in_progress';
    if (companyFilter === 'in_progress') return todo.status === 'in_progress';
    return true;
  });

  const companyCounts = {
    all: companyTodos.length,
    pending: companyTodos.filter(t => !t.completed && t.status !== 'completed' && t.status !== 'in_progress').length,
    in_progress: companyTodos.filter(t => t.status === 'in_progress').length,
    completed: companyTodos.filter(t => t.completed || t.status === 'completed').length
  };

  const totalPending = Object.values(projectTodos).flat().filter(t => !t.completed).length +
    Object.values(projectPunchItems).flat().filter(p => p.status !== 'completed' && p.status !== 'verified').length +
    companyTodos.filter(t => !t.completed).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.98) 0%, rgba(30,30,40,0.95) 100%)' }}>
        <div className="text-[#D4A574] text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.98) 0%, rgba(30,30,40,0.95) 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-[#D4A574] hover:text-white text-2xl">←</button>
          <div>
            <h1 className="text-3xl font-bold text-[#D4A574]">Master To-Do List</h1>
            <p className="text-gray-400">{totalPending} items pending across all projects</p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'company', 'projects'].map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeSection === section
                ? 'bg-[#D4A574] text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {section === 'all' ? '📋 All Tasks' : section === 'company' ? '🏢 Company Tasks' : '🏠 Project Tasks'}
          </button>
        ))}
      </div>

      {/* COMPANY SECTION - REBUILT TO MATCH PUNCHLIST */}
      {(activeSection === 'all' || activeSection === 'company') && (
        <div className="rounded-xl border border-[#D4A574]/30 overflow-hidden mb-6"
             data-testid="company-todo-container"
             style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(30,30,40,0.9) 100%)' }}>
          
          {/* Company Header */}
          <div 
            className="px-6 py-4 flex items-center justify-between border-b border-[#B49B7E]/20"
            style={{ background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.3) 0%, rgba(160, 82, 45, 0.2) 100%)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏢</span>
              <div>
                <h3 className="text-[#D4A574] font-bold text-lg">Established Design Co - Company Tasks</h3>
                <p className="text-gray-500 text-sm">
                  {companyCounts.pending} pending • {companyCounts.completed} completed
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCompanyAddForm(true)}
              data-testid="add-company-todo-btn"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-3 py-2 rounded-lg font-bold text-sm"
            >
              + Add Company Task
            </button>
          </div>
          
          {/* Company Filter Tabs */}
          <div className="flex border-b border-[#B49B7E]/20">
            {['all', 'pending', 'in_progress', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setCompanyFilter(status)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  companyFilter === status 
                    ? 'text-[#D4A574] border-b-2 border-[#D4A574] bg-[#D4A574]/10' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
                <span className="ml-2 text-xs opacity-70">({companyCounts[status] || 0})</span>
              </button>
            ))}
          </div>
          
          {/* Company Add Form - MATCHING PUNCHLIST EXACTLY */}
          {showCompanyAddForm && (
            <div className="p-4 border-b border-[#B49B7E]/20 bg-black/30">
              <form onSubmit={createCompanyTodo} className="space-y-3">
                <input
                  type="text"
                  value={newCompanyTodo.text}
                  onChange={(e) => setNewCompanyTodo(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="What needs to be done?"
                  data-testid="company-todo-text-input"
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500 focus:border-[#D4A574] focus:outline-none"
                  required
                />
                <textarea
                  value={newCompanyTodo.description}
                  onChange={(e) => setNewCompanyTodo(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details (optional)"
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500 focus:border-[#D4A574] focus:outline-none resize-none"
                />
                
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={newCompanyTodo.priority}
                    onChange={(e) => setNewCompanyTodo(prev => ({ ...prev, priority: e.target.value }))}
                    className="px-4 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <input
                    type="text"
                    value={newCompanyTodo.assigned_to}
                    onChange={(e) => setNewCompanyTodo(prev => ({ ...prev, assigned_to: e.target.value }))}
                    placeholder="Assign to (optional)"
                    className="flex-1 px-4 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500 focus:border-[#D4A574] focus:outline-none"
                  />
                  <input
                    type="date"
                    value={newCompanyTodo.deadline}
                    onChange={(e) => setNewCompanyTodo(prev => ({ ...prev, deadline: e.target.value }))}
                    data-testid="company-deadline-input"
                    className="px-4 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
                    title="Deadline"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
                  >
                    Add Company Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCompanyAddForm(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Company Items List - MATCHING PUNCHLIST */}
          <div className="divide-y divide-[#B49B7E]/10">
            {filteredCompanyTodos.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No company tasks yet.</p>
                <button
                  onClick={() => setShowCompanyAddForm(true)}
                  className="text-[#D4A574] hover:text-[#B49B7E]"
                >
                  + Add your first company task
                </button>
              </div>
            ) : (
              // SORT: Completed items go to BOTTOM of the list
              [...filteredCompanyTodos].sort((a, b) => {
                const aIsDone = a.completed || a.status === 'completed';
                const bIsDone = b.completed || b.status === 'completed';
                if (aIsDone && !bIsDone) return 1;
                if (!aIsDone && bIsDone) return -1;
                return 0;
              }).map(todo => (
                <div 
                  key={todo.id} 
                  data-testid={`company-todo-${todo.id}`}
                  className={`p-4 hover:bg-black/20 transition-colors ${
                    todo.completed || todo.status === 'completed' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Toggle */}
                    <button
                      onClick={() => {
                        const nextStatus = {
                          pending: 'in_progress',
                          in_progress: 'completed',
                          completed: 'pending',
                          undefined: 'in_progress'
                        };
                        updateCompanyTodoStatus(todo.id, nextStatus[todo.status || 'pending']);
                      }}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                        todo.completed || todo.status === 'completed'
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-gray-500 hover:border-[#D4A574]'
                      }`}
                    >
                      {getStatusIcon(todo.status, todo.completed)}
                    </button>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-medium ${
                          todo.completed || todo.status === 'completed' 
                            ? 'line-through text-gray-500' 
                            : 'text-white'
                        }`}>
                          {todo.text}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(todo.priority)} text-white`}>
                          {todo.priority}
                        </span>
                      </div>
                      
                      {todo.description && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {todo.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                        {/* STATUS - EDITABLE DROPDOWN */}
                        <select
                          value={todo.status || 'pending'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateCompanyTodoStatus(todo.id, e.target.value);
                          }}
                          className={`text-xs px-2 py-0.5 rounded-full cursor-pointer border-none outline-none ${
                            todo.status === 'completed' ? 'bg-green-600 text-white' :
                            todo.status === 'in_progress' ? 'bg-blue-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}
                          style={{ background: 'inherit' }}
                        >
                          <option value="pending" className="bg-gray-800">⏳ Pending</option>
                          <option value="in_progress" className="bg-gray-800">🔄 Working</option>
                          <option value="completed" className="bg-gray-800">✅ Done</option>
                        </select>
                        {/* PRIORITY - EDITABLE DROPDOWN */}
                        <select
                          value={todo.priority || 'medium'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateCompanyTodoPriority(todo.id, e.target.value);
                          }}
                          className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(todo.priority)} text-white cursor-pointer border-none outline-none`}
                          style={{ background: 'inherit' }}
                        >
                          <option value="low" className="bg-gray-800">Low</option>
                          <option value="medium" className="bg-gray-800">Medium</option>
                          <option value="high" className="bg-gray-800">High</option>
                          <option value="urgent" className="bg-gray-800">Urgent</option>
                        </select>
                        {todo.assigned_to && (
                          <span>👤 {todo.assigned_to}</span>
                        )}
                        {todo.deadline && (
                          <span className="text-amber-400">📅 {new Date(todo.deadline).toLocaleDateString()}</span>
                        )}
                        <span>
                          {new Date(todo.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <button
                      onClick={() => deleteTodo(todo.id, true)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PROJECT SECTIONS */}
      {(activeSection === 'all' || activeSection === 'projects') && projects.map((project, idx) => {
        const todos = projectTodos[project.id] || [];
        const punchItems = projectPunchItems[project.id] || [];
        const color = JOB_COLORS[idx % JOB_COLORS.length];
        const hasTasks = todos.length > 0 || punchItems.length > 0;
        
        if (!hasTasks) return null;
        
        return (
          <div key={project.id} className="mb-6 rounded-xl overflow-hidden border" style={{ borderColor: color.border, background: color.bg }}>
            <div 
              className="px-6 py-4 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedProjects(prev => ({ ...prev, [project.id]: !prev[project.id] }))}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏠</span>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: color.accent }}>{project.name}</h3>
                  <p className="text-gray-400 text-sm">
                    {todos.filter(t => !t.completed).length} to-dos • {punchItems.filter(p => p.status !== 'completed').length} punch items
                  </p>
                </div>
              </div>
              <span className="text-white text-xl">{expandedProjects[project.id] ? '▼' : '▶'}</span>
            </div>
            
            {expandedProjects[project.id] && (
              <div className="px-6 pb-4 space-y-1">
                {/* Project To-Dos - SORTED: Done items at bottom */}
                {[...todos].sort((a, b) => {
                  const aIsDone = a.completed || a.status === 'completed';
                  const bIsDone = b.completed || b.status === 'completed';
                  if (aIsDone && !bIsDone) return 1;
                  if (!aIsDone && bIsDone) return -1;
                  return 0;
                }).map((todo, todoIdx) => {
                  const linkedItem = todo.linked_ffe_item || todo.linked_checklist_item || {};
                  const sourceType = todo.source_type || linkedItem.source_type || 'checklist';
                  const sheetLabel = sourceType === 'ffe' ? 'FF&E' : sourceType === 'walkthrough' ? 'WALKTHROUGH' : 'CHECKLIST';
                  const roomName = linkedItem.room_name || linkedItem.room || todo.room_name || '';
                  const categoryName = linkedItem.category_name || linkedItem.category || '';
                  const vendorName = linkedItem.vendor || linkedItem.vendor_name || '';
                  const sku = linkedItem.sku || '';
                  const itemName = linkedItem.name || linkedItem.item_name || '';
                  
                  // Build link URL
                  const tabParam = sourceType === 'ffe' ? 'FF%26E' : sourceType === 'walkthrough' ? 'Walkthrough' : 'Checklist';
                  const itemLink = `/project/${project.id}?tab=${tabParam}`;
                  
                  return (
                    <div key={todo.id} className={`p-3 rounded-lg ${todoIdx % 2 === 0 ? 'bg-black/30' : 'bg-black/15'}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo.id, todo.completed)}
                          className="w-5 h-5 cursor-pointer flex-shrink-0"
                        />
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(todo.priority)} text-white flex-shrink-0`}>
                          {todo.priority}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                            {todo.text}
                          </div>
                          {/* Item identifiers - ROOM, CATEGORY, VENDOR, SKU */}
                          {(roomName || itemName || vendorName) && (
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                              {roomName && (
                                <span className="bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded">
                                  🏠 {roomName}
                                </span>
                              )}
                              {categoryName && (
                                <span className="bg-teal-600/30 text-teal-300 px-2 py-0.5 rounded">
                                  📁 {categoryName}
                                </span>
                              )}
                              {itemName && (
                                <span className="bg-amber-600/30 text-amber-300 px-2 py-0.5 rounded">
                                  📦 {itemName}
                                </span>
                              )}
                              {vendorName && (
                                <span className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded">
                                  🏪 {vendorName}
                                </span>
                              )}
                              {sku && (
                                <span className="bg-gray-600/30 text-gray-300 px-2 py-0.5 rounded">
                                  # {sku}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {todo.deadline && (
                          <span className="text-amber-400 text-xs flex-shrink-0">📅 {new Date(todo.deadline).toLocaleDateString()}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded text-white flex-shrink-0 ${
                          sourceType === 'ffe' ? 'bg-green-600' : sourceType === 'walkthrough' ? 'bg-purple-600' : 'bg-blue-600'
                        }`}>
                          {sheetLabel}
                        </span>
                        <a 
                          href={itemLink}
                          onClick={(e) => { e.preventDefault(); navigate(itemLink); }}
                          className="text-[#D4A574] hover:text-white text-sm flex-shrink-0"
                          title="Go to item"
                        >
                          🔗
                        </a>
                        <button onClick={() => deleteTodo(todo.id)} className="text-red-400 hover:text-red-300 flex-shrink-0">🗑️</button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Punch Items */}
                {punchItems.map((item, itemIdx) => {
                  const linkedItem = item.linked_ffe_item || {};
                  const sourceType = item.source_type || linkedItem.source_type || 'checklist';
                  const sheetLabel = sourceType === 'ffe' ? 'FF&E' : sourceType === 'walkthrough' ? 'WALKTHROUGH' : 'CHECKLIST';
                  const roomName = linkedItem.room_name || linkedItem.room || item.room_name || '';
                  const categoryName = linkedItem.category_name || linkedItem.category || '';
                  const vendorName = linkedItem.vendor || linkedItem.vendor_name || '';
                  const sku = linkedItem.sku || '';
                  const itemName = linkedItem.name || linkedItem.item_name || '';
                  
                  // Build link URL
                  const tabParam = sourceType === 'ffe' ? 'FF%26E' : sourceType === 'walkthrough' ? 'Walkthrough' : 'Checklist';
                  const itemLink = `/project/${project.id}?tab=${tabParam}`;
                  
                  return (
                    <div key={item.id} className={`p-3 rounded-lg ${(todos.length + itemIdx) % 2 === 0 ? 'bg-black/30' : 'bg-black/15'}`}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePunchItem(item.id, item.status)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs flex-shrink-0 ${
                            item.status === 'completed' || item.status === 'verified'
                              ? 'border-green-500 bg-green-500/20 text-green-400'
                              : 'border-gray-500 hover:border-[#D4A574]'
                          }`}
                        >
                          {item.status === 'completed' || item.status === 'verified' ? '✓' : ''}
                        </button>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(item.priority)} text-white flex-shrink-0`}>
                          {item.priority}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${item.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>
                            {item.title}
                          </div>
                          {/* Item identifiers - ROOM, CATEGORY, VENDOR, SKU */}
                          {(roomName || itemName || vendorName) && (
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                              {roomName && (
                                <span className="bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded">
                                  🏠 {roomName}
                                </span>
                              )}
                              {categoryName && (
                                <span className="bg-teal-600/30 text-teal-300 px-2 py-0.5 rounded">
                                  📁 {categoryName}
                                </span>
                              )}
                              {itemName && (
                                <span className="bg-amber-600/30 text-amber-300 px-2 py-0.5 rounded">
                                  📦 {itemName}
                                </span>
                              )}
                              {vendorName && (
                                <span className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded">
                                  🏪 {vendorName}
                                </span>
                              )}
                              {sku && (
                                <span className="bg-gray-600/30 text-gray-300 px-2 py-0.5 rounded">
                                  # {sku}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {item.due_date && (
                          <span className="text-amber-400 text-xs flex-shrink-0">📅 {new Date(item.due_date).toLocaleDateString()}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded text-white flex-shrink-0 ${
                          sourceType === 'ffe' ? 'bg-green-600' : 'bg-orange-600'
                        }`}>
                          PUNCH • {sheetLabel}
                        </span>
                        <a 
                          href={itemLink}
                          onClick={(e) => { e.preventDefault(); navigate(itemLink); }}
                          className="text-[#D4A574] hover:text-white text-sm flex-shrink-0"
                          title="Go to item"
                        >
                          🔗
                        </a>
                        <button onClick={() => deletePunchItem(item.id)} className="text-red-400 hover:text-red-300 flex-shrink-0">🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {!loading && projects.length === 0 && companyTodos.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-xl mb-4">No tasks found</p>
          <p>Create projects and add to-do items to see them here.</p>
        </div>
      )}
    </div>
  );
}

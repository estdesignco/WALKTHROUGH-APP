import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

// Alternating row colors - similar tones
const ROW_COLORS = {
  company: ['rgba(124, 58, 237, 0.15)', 'rgba(124, 58, 237, 0.08)'], // Purple tones
  project: ['rgba(139, 115, 85, 0.2)', 'rgba(139, 115, 85, 0.1)'], // Brown tones
};

// Project header colors
const PROJECT_COLORS = [
  { bg: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)', border: '#CD853F', accent: '#DEB887' },
  { bg: 'linear-gradient(135deg, #2F4F4F 0%, #3D5C5C 100%)', border: '#5F9EA0', accent: '#87CEEB' },
  { bg: 'linear-gradient(135deg, #4A3728 0%, #5D4037 100%)', border: '#8D6E63', accent: '#D7CCC8' },
  { bg: 'linear-gradient(135deg, #1C3A4B 0%, #2C5364 100%)', border: '#4682B4', accent: '#87CEEB' },
  { bg: 'linear-gradient(135deg, #BF360C 0%, #E64A19 100%)', border: '#FF7043', accent: '#FFAB91' },
  { bg: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)', border: '#5C6BC0', accent: '#9FA8DA' },
];

const getPriorityColor = (priority) => {
  const colors = {
    low: 'bg-gray-600', medium: 'bg-cyan-600', high: 'bg-orange-600', urgent: 'bg-red-600'
  };
  return colors[priority?.toLowerCase()] || 'bg-gray-600';
};

const getStatusIcon = (status, completed) => {
  if (completed) return '✅';
  const icons = { pending: '⏳', in_progress: '🔄', completed: '✅' };
  return icons[status] || '⏳';
};

export default function GlobalToDoModal({ isOpen, onClose }) {
  const [projects, setProjects] = useState([]);
  const [companyTodos, setCompanyTodos] = useState([]);
  const [projectTodos, setProjectTodos] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  
  // Comment state
  const [commentingId, setCommentingId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  
  // Quick add form state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddPriority, setQuickAddPriority] = useState('medium');
  const [quickAddAssignee, setQuickAddAssignee] = useState('');
  const [quickAddDeadline, setQuickAddDeadline] = useState('');

  const loadData = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      // Load projects
      const projectsRes = await axios.get(`${API_URL}/projects`);
      const projectsList = projectsRes.data.projects || projectsRes.data || [];
      setProjects(projectsList);
      
      // Load company todos
      const companyRes = await axios.get(`${API_URL}/todos/company`);
      setCompanyTodos(companyRes.data.todos || []);
      
      // Load project todos
      const todosMap = {};
      for (const project of projectsList) {
        try {
          const todosRes = await axios.get(`${API_URL}/todos/${project.id}`);
          todosMap[project.id] = todosRes.data.todos || [];
        } catch (e) { todosMap[project.id] = []; }
      }
      setProjectTodos(todosMap);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quick add task
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddText.trim()) return;
    try {
      await axios.post(`${API_URL}/todos/company`, {
        text: quickAddText.trim(),
        priority: quickAddPriority,
        assigned_to: quickAddAssignee || null,
        deadline: quickAddDeadline || null,
        status: 'pending',
        completed: false
      });
      setQuickAddText('');
      setQuickAddPriority('medium');
      setQuickAddAssignee('');
      setQuickAddDeadline('');
      setShowQuickAdd(false);
      loadData();
    } catch (error) {
      alert('Failed to add: ' + error.message);
    }
  };

  // Toggle status - Now accepts direct status value
  const toggleStatus = async (todoId, currentStatus, isCompany, projectId, newStatusOverride = null) => {
    const nextStatus = { pending: 'in_progress', in_progress: 'completed', completed: 'pending', done: 'pending' };
    const newStatus = newStatusOverride || nextStatus[currentStatus || 'pending'];
    const newCompleted = newStatus === 'completed' || newStatus === 'done';
    
    // Optimistic update
    setAllTodos(prev => prev.map(t => 
      t.id === todoId ? { ...t, status: newStatus, completed: newCompleted } : t
    ));
    
    try {
      const endpoint = isCompany 
        ? `${API_URL}/todos/company/${todoId}` 
        : `${API_URL}/todos/${todoId}`;
      await axios.put(endpoint, { 
        status: newStatus, 
        completed: newCompleted 
      });
    } catch (error) {
      console.error('Failed:', error);
      loadData(); // Revert on error
    }
  };

  // Start inline editing - Include notes and status
  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditValues({
      text: todo.text || '',
      notes: todo.notes || todo.description || '',
      status: todo.status || 'pending',
      priority: todo.priority || 'medium',
      assigned_to: todo.assigned_to || '',
      deadline: todo.deadline ? todo.deadline.split('T')[0] : ''
    });
  };

  // Save inline edit
  const saveEdit = async (todoId, isCompany, projectId) => {
    try {
      const endpoint = isCompany 
        ? `${API_URL}/todos/company/${todoId}` 
        : `${API_URL}/todos/${projectId}/${todoId}`;
      await axios.put(endpoint, {
        text: editValues.text,
        notes: editValues.notes || '',
        status: editValues.status || 'pending',
        completed: editValues.status === 'completed',
        priority: editValues.priority,
        assigned_to: editValues.assigned_to || null,
        deadline: editValues.deadline || null
      });
      setEditingId(null);
      setEditValues({});
      loadData();
    } catch (error) {
      alert('Failed to save: ' + error.message);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  // Add comment to todo
  const addComment = async (todoId, isCompany) => {
    if (!newComment.trim()) return;
    try {
      await axios.post(`${API_URL}/todos/${todoId}/comments`, {
        text: newComment.trim(),
        author: '' // Could add user name here
      });
      setNewComment('');
      setCommentingId(null);
      loadData(); // Refresh to show new comment
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  // Toggle comment expansion
  const toggleComments = (todoId) => {
    setExpandedComments(prev => ({ ...prev, [todoId]: !prev[todoId] }));
  };

  // Delete todo
  const deleteTodo = async (todoId, isCompany, projectId) => {
    try {
      const endpoint = isCompany 
        ? `${API_URL}/todos/company/${todoId}` 
        : `${API_URL}/todos/${projectId}/${todoId}`;
      await axios.delete(endpoint);
      loadData();
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  // Render a single todo item with inline editing
  const renderTodoItem = (todo, index, isCompany, projectId = null) => {
    const isEditing = editingId === todo.id;
    const bgColor = isCompany 
      ? ROW_COLORS.company[index % 2] 
      : ROW_COLORS.project[index % 2];
    
    const linkedItem = todo.linked_ffe_item || todo.linked_checklist_item || {};
    const roomName = linkedItem.room_name || linkedItem.room || todo.room_name || '';
    const categoryName = linkedItem.category_name || linkedItem.category || '';
    
    return (
      <div 
        key={todo.id} 
        className={`p-3 rounded-lg mb-1 transition-all ${todo.completed ? 'opacity-60' : ''}`}
        style={{ background: bgColor }}
      >
        {isEditing ? (
          // INLINE EDIT MODE - With Notes/Comments
          <div className="space-y-2">
            <input
              type="text"
              value={editValues.text}
              onChange={(e) => setEditValues(prev => ({ ...prev, text: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-black/50 border border-[#D4A574] text-white text-sm"
              placeholder="Task description..."
              autoFocus
            />
            {/* NOTES/COMMENTS FIELD */}
            <textarea
              value={editValues.notes || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add notes or comments..."
              className="w-full px-3 py-2 rounded bg-black/50 border border-[#8b7355] text-white text-sm min-h-[60px] resize-y"
            />
            <div className="flex gap-2 flex-wrap">
              {/* STATUS DROPDOWN */}
              <select
                value={editValues.status || 'pending'}
                onChange={(e) => setEditValues(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-1.5 rounded bg-black/50 border border-[#8b7355] text-white text-sm"
              >
                <option value="pending">⏳ Pending</option>
                <option value="in_progress">🔄 In Progress</option>
                <option value="completed">✅ Completed</option>
              </select>
              <select
                value={editValues.priority}
                onChange={(e) => setEditValues(prev => ({ ...prev, priority: e.target.value }))}
                className="px-3 py-1.5 rounded bg-black/50 border border-[#8b7355] text-white text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <input
                type="text"
                value={editValues.assigned_to}
                onChange={(e) => setEditValues(prev => ({ ...prev, assigned_to: e.target.value }))}
                placeholder="Assignee"
                className="flex-1 min-w-[120px] px-3 py-1.5 rounded bg-black/50 border border-[#8b7355] text-white text-sm"
              />
              <input
                type="date"
                value={editValues.deadline}
                onChange={(e) => setEditValues(prev => ({ ...prev, deadline: e.target.value }))}
                className="px-3 py-1.5 rounded bg-black/50 border border-[#8b7355] text-white text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => saveEdit(todo.id, isCompany, projectId)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // DISPLAY MODE - Click anywhere to edit
          <div className="flex items-center gap-3">
            {/* Status Toggle Button - Better visibility */}
            <select
              value={todo.status || 'pending'}
              onChange={(e) => {
                e.stopPropagation();
                const newStatus = e.target.value;
                toggleStatus(todo.id, todo.status, isCompany, projectId, newStatus);
              }}
              className={`w-24 px-2 py-1 rounded text-xs font-bold cursor-pointer ${
                todo.completed || todo.status === 'completed'
                  ? 'bg-green-600 text-white'
                  : todo.status === 'in_progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="pending">⏳ Pending</option>
              <option value="in_progress">🔄 Working</option>
              <option value="completed">✅ Done</option>
            </select>
            
            {/* Main Content - Click to Edit */}
            <div 
              className="flex-1 min-w-0 cursor-pointer hover:bg-white/5 rounded p-1 -m-1"
              onClick={() => startEditing(todo)}
              title="Click to edit"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                  {todo.text}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${getPriorityColor(todo.priority)} text-white`}>
                  {todo.priority}
                </span>
              </div>
              
              {/* Notes/Comments - Show if exists */}
              {(todo.notes || todo.description) && (
                <div className="mt-1 text-xs text-gray-400 italic bg-black/20 rounded px-2 py-1">
                  💬 {todo.notes || todo.description}
                </div>
              )}
              
              {/* ADDITIONAL COMMENTS THREAD */}
              <div className="mt-2">
                {/* Show existing comments */}
                {todo.comments && todo.comments.length > 0 && (
                  <div className="mb-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleComments(todo.id); }}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      📝 {todo.comments.length} comment{todo.comments.length > 1 ? 's' : ''} {expandedComments[todo.id] ? '▼' : '▶'}
                    </button>
                    {expandedComments[todo.id] && (
                      <div className="mt-1 space-y-1 pl-2 border-l-2 border-cyan-600/30">
                        {todo.comments.map((comment, idx) => (
                          <div key={comment.id || idx} className="text-xs bg-cyan-900/20 rounded px-2 py-1">
                            <span className="text-cyan-400">{comment.text}</span>
                            <span className="text-gray-500 ml-2">
                              {comment.created_at && new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Add comment button/form */}
                {commentingId === todo.id ? (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-2 py-1 text-xs rounded bg-black/50 border border-cyan-600/50 text-white"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && addComment(todo.id, isCompany)}
                    />
                    <button
                      onClick={() => addComment(todo.id, isCompany)}
                      className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setCommentingId(null); setNewComment(''); }}
                      className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setCommentingId(todo.id); }}
                    className="text-xs text-cyan-500 hover:text-cyan-400"
                  >
                    + Add comment
                  </button>
                )}
              </div>
              
              {/* Room/Category tags */}
              {(roomName || categoryName) && (
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {roomName && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-600/30 text-purple-300">
                      🏠 {roomName}
                    </span>
                  )}
                  {categoryName && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-600/30 text-teal-300">
                      📁 {categoryName}
                    </span>
                  )}
                </div>
              )}
              
              {/* Meta info */}
              <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 flex-wrap">
                {todo.assigned_to && <span>👤 {todo.assigned_to}</span>}
                {todo.deadline && (
                  <span className="text-amber-400">
                    📅 {new Date(todo.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            
            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTodo(todo.id, isCompany, projectId);
              }}
              className="text-red-400/50 hover:text-red-400 text-sm flex-shrink-0 p-1"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const totalPending = companyTodos.filter(t => !t.completed).length + 
    Object.values(projectTodos).flat().filter(t => !t.completed).length;

  return (
    <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4">
      <div 
        className="w-full max-w-6xl h-[90vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
          border: '2px solid #8b7355'
        }}
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-[#8b7355]/50 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-[#D4A574]">Master To-Do List</h1>
            <p className="text-gray-400 text-sm">{totalPending} tasks pending</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
            >
              + Add Task
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-3xl w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* QUICK ADD FORM - Always visible when toggled */}
        {showQuickAdd && (
          <div className="px-6 py-4 border-b border-[#8b7355]/30 bg-black/40 flex-shrink-0">
            <form onSubmit={handleQuickAdd} className="space-y-3">
              <input
                type="text"
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                placeholder="What needs to be done? (Press Enter to add)"
                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-[#8b7355] text-white placeholder-gray-500 text-base"
                autoFocus
              />
              <div className="flex gap-3 flex-wrap items-center">
                <select
                  value={quickAddPriority}
                  onChange={(e) => setQuickAddPriority(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-black/50 border border-[#8b7355] text-white"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input
                  type="text"
                  value={quickAddAssignee}
                  onChange={(e) => setQuickAddAssignee(e.target.value)}
                  placeholder="Assign to..."
                  className="flex-1 min-w-[150px] px-4 py-2 rounded-lg bg-black/50 border border-[#8b7355] text-white placeholder-gray-500"
                />
                <input
                  type="date"
                  value={quickAddDeadline}
                  onChange={(e) => setQuickAddDeadline(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-black/50 border border-[#8b7355] text-white"
                />
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="text-gray-400 hover:text-white px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABS */}
        <div className="flex border-b border-[#8b7355]/30 flex-shrink-0">
          {[
            { key: 'all', label: '📋 All', count: totalPending },
            { key: 'company', label: '🏢 Company', count: companyTodos.filter(t => !t.completed).length },
            { key: 'projects', label: '🏠 Projects', count: Object.values(projectTodos).flat().filter(t => !t.completed).length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-[#D4A574] border-b-2 border-[#D4A574] bg-[#D4A574]/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label} <span className="opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[#D4A574] text-xl">Loading...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* COMPANY TASKS */}
              {(activeTab === 'all' || activeTab === 'company') && (
                <div className="rounded-xl overflow-hidden" style={{ border: '2px solid #7C3AED' }}>
                  <div 
                    className="px-4 py-3 flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
                  >
                    <h3 className="text-white font-bold text-lg">🏢 Company Tasks</h3>
                    <span className="text-white/70 text-sm">
                      {companyTodos.filter(t => !t.completed).length} pending
                    </span>
                  </div>
                  <div className="p-3 bg-[#0f0f1a]/80">
                    {companyTodos.length === 0 ? (
                      <p className="text-gray-500 text-center py-6">
                        No company tasks. Click "+ Add Task" to create one.
                      </p>
                    ) : (
                      companyTodos.map((todo, idx) => renderTodoItem(todo, idx, true))
                    )}
                  </div>
                </div>
              )}

              {/* PROJECT TASKS */}
              {(activeTab === 'all' || activeTab === 'projects') && projects.map((project, projIdx) => {
                const todos = projectTodos[project.id] || [];
                if (todos.length === 0) return null;
                
                const color = PROJECT_COLORS[projIdx % PROJECT_COLORS.length];
                
                return (
                  <div 
                    key={project.id} 
                    className="rounded-xl overflow-hidden"
                    style={{ border: `2px solid ${color.border}` }}
                  >
                    <div 
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ background: color.bg }}
                    >
                      <h3 className="text-white font-bold text-lg">🏠 {project.name}</h3>
                      <span className="text-white/70 text-sm">
                        {todos.filter(t => !t.completed).length} pending
                      </span>
                    </div>
                    <div className="p-3 bg-[#0f0f1a]/80">
                      {todos.map((todo, idx) => renderTodoItem(todo, idx, false, project.id))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER TIP */}
        <div className="px-6 py-2 border-t border-[#8b7355]/30 text-center text-gray-500 text-xs flex-shrink-0">
          💡 Click on any task text to edit inline • Click the status circle to change status
        </div>
      </div>
    </div>
  );
}

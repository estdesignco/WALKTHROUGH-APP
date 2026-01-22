import React, { useState, useEffect } from 'react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * ToDoList - Manage to-do items for a project
 * REBUILT to match PunchList interface EXACTLY per user request
 * Includes FFE linking, deadline, and Teams webhook support
 */
export default function ToDoList({ projectId, roomId = null }) {
  const [todoItems, setTodoItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, in_progress, completed
  
  // FFE Linking states
  const [ffeItems, setFfeItems] = useState([]);
  const [ffeSearchQuery, setFfeSearchQuery] = useState('');
  const [showFfeDropdown, setShowFfeDropdown] = useState(false);
  const [selectedFfeItem, setSelectedFfeItem] = useState(null);
  const [linkingItemId, setLinkingItemId] = useState(null); // For linking existing items
  
  // COMMENT states
  const [commentingId, setCommentingId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  
  const [newItem, setNewItem] = useState({
    text: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    deadline: '',
    linked_ffe_item: null
  });

  useEffect(() => {
    loadTodoList();
  }, [projectId, filter]);

  // Load BOTH Checklist AND FFE items for linking
  useEffect(() => {
    loadAllItems();
  }, [projectId]);

  const loadAllItems = async () => {
    try {
      const itemsMap = new Map(); // Dedupe by ID, FFE takes priority
      
      // Load FFE FIRST so FFE items appear first and take priority
      for (const sheetType of ['ffe', 'checklist']) {
        try {
          const res = await fetch(`${API_URL}/projects/${projectId}?sheet_type=${sheetType}`);
          if (res.ok) {
            const data = await res.json();
            (data.rooms || []).forEach(room => {
              (room.categories || []).forEach(cat => {
                (cat.subcategories || []).forEach(subCat => {
                  (subCat.items || []).forEach(item => {
                    if (!itemsMap.has(item.id)) {
                      itemsMap.set(item.id, {
                        ...item,
                        roomName: room.name,
                        categoryName: cat.name,
                        sourceType: sheetType.toUpperCase()
                      });
                    }
                  });
                });
              });
            });
          }
        } catch (e) { /* ignore sheet load errors */ }
      }
      
      console.log(`📦 ToDoList: Loaded ${itemsMap.size} unique items (FFE priority)`);
      setFfeItems(Array.from(itemsMap.values()));
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  };

  // Filter items by search query
  const filteredFfeItems = ffeItems.filter(item => {
    if (!ffeSearchQuery) return true;
    const query = ffeSearchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.sku?.toLowerCase().includes(query) ||
      item.roomName?.toLowerCase().includes(query) ||
      item.vendor?.toLowerCase().includes(query) ||
      item.sourceType?.toLowerCase().includes(query)
    );
  }).slice(0, 10); // Limit to 10 results

  const loadTodoList = async () => {
    try {
      const response = await fetch(`${API_URL}/todos/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        let items = data.todos || [];
        
        // Apply filter - include 'done' status
        if (filter !== 'all') {
          items = items.filter(item => {
            const itemIsDone = item.completed || item.status === 'completed' || item.status === 'done';
            if (filter === 'completed') return itemIsDone;
            if (filter === 'pending') return !itemIsDone && item.status !== 'in_progress' && item.status !== 'working';
            if (filter === 'in_progress') return item.status === 'in_progress' || item.status === 'working';
            return true;
          });
        }
        
        setTodoItems(items);
      }
    } catch (error) {
      console.error('Failed to load to-do list:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTodoItem = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          text: newItem.text,
          description: newItem.description,
          priority: newItem.priority,
          assigned_to: newItem.assigned_to,
          deadline: newItem.deadline || null,
          status: 'pending',
          source_type: selectedFfeItem?.sourceType?.toLowerCase() || 'checklist',
          linked_ffe_item: selectedFfeItem ? {
            id: selectedFfeItem.id,
            name: selectedFfeItem.name,
            sku: selectedFfeItem.sku,
            vendor: selectedFfeItem.vendor,
            room_name: selectedFfeItem.roomName,
            category_name: selectedFfeItem.categoryName,
            source_type: selectedFfeItem.sourceType?.toLowerCase() || 'checklist'
          } : null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTodoItems(prev => [data.todo, ...prev]);
        setNewItem({ text: '', description: '', priority: 'medium', assigned_to: '', deadline: '', linked_ffe_item: null });
        setSelectedFfeItem(null);
        setFfeSearchQuery('');
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Failed to create to-do item:', error);
    }
  };

  // Link an existing item to an FFE item
  const linkTodoToFfe = async (todoId, ffeItem) => {
    try {
      const response = await fetch(`${API_URL}/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: ffeItem.sourceType?.toLowerCase() || 'checklist',
          linked_ffe_item: {
            id: ffeItem.id,
            name: ffeItem.name,
            sku: ffeItem.sku,
            vendor: ffeItem.vendor,
            room_name: ffeItem.roomName,
            category_name: ffeItem.categoryName,
            source_type: ffeItem.sourceType?.toLowerCase() || 'checklist'
          }
        })
      });
      
      if (response.ok) {
        loadTodoList();
        setLinkingItemId(null);
        setFfeSearchQuery('');
      }
    } catch (error) {
      console.error('Failed to link to-do item to FFE:', error);
    }
  };

  // Unlink FFE from to-do item
  const unlinkFfeFromTodo = async (todoId) => {
    try {
      const response = await fetch(`${API_URL}/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linked_ffe_item: null })
      });
      
      if (response.ok) {
        loadTodoList();
      }
    } catch (error) {
      console.error('Failed to unlink FFE:', error);
    }
  };

  const updateTodoItem = async (itemId, updates) => {
    try {
      const response = await fetch(`${API_URL}/todos/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        loadTodoList();
      }
    } catch (error) {
      console.error('Failed to update to-do item:', error);
    }
  };

  const deleteTodoItem = async (itemId) => {
    try {
      const response = await fetch(`${API_URL}/todos/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setTodoItems(prev => prev.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Failed to delete to-do item:', error);
    }
  };

  // ADD COMMENT to todo item
  const addTodoComment = async (itemId) => {
    if (!newComment.trim()) return;
    try {
      const response = await fetch(`${API_URL}/todos/${itemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment.trim(), author: '' })
      });
      if (response.ok) {
        const data = await response.json();
        // Update local state with new comment
        setTodoItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, comments: [...(item.comments || []), data.comment] }
            : item
        ));
        setNewComment('');
        setCommentingId(null);
        // Auto-expand comments after adding
        setExpandedComments(prev => ({ ...prev, [itemId]: true }));
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  // Toggle comment expansion
  const toggleComments = (itemId) => {
    setExpandedComments(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-600',
      medium: 'bg-cyan-600',  // CHANGED from yellow to cyan to differ from "Modern Kitchen"
      high: 'bg-orange-600',
      urgent: 'bg-red-600',
      Low: 'bg-gray-600',
      Medium: 'bg-cyan-600',  // CHANGED from yellow to cyan
      High: 'bg-orange-600'
    };
    return colors[priority] || 'bg-gray-600';
  };

  const getStatusColor = (status, completed) => {
    if (completed) return 'text-green-400';
    const colors = {
      pending: 'text-gray-400',
      in_progress: 'text-blue-400',
      completed: 'text-green-400'
    };
    return colors[status] || 'text-gray-400';
  };

  const getStatusIcon = (status, completed) => {
    if (completed) return '✅';
    const icons = {
      pending: '⏳',
      in_progress: '🔄',
      completed: '✅'
    };
    return icons[status] || '⏳';
  };

  // PRIORITY TIMER - Items grow in urgency as time passes
  const getTimePriority = (createdAt) => {
    if (!createdAt) return { level: 'new', label: '🆕 New', color: 'bg-green-600', days: 0 };
    
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays >= 7) {
      return { level: 'critical', label: `🔥 ${diffDays}d - CRITICAL`, color: 'bg-red-600 animate-pulse', days: diffDays };
    } else if (diffDays >= 3) {
      return { level: 'high', label: `⚠️ ${diffDays}d - Aging`, color: 'bg-orange-500', days: diffDays };
    } else if (diffDays >= 1) {
      return { level: 'medium', label: `⏰ ${diffDays}d old`, color: 'bg-yellow-600', days: diffDays };
    } else if (diffHours >= 1) {
      return { level: 'low', label: `🕐 ${diffHours}h old`, color: 'bg-blue-600', days: 0 };
    } else {
      return { level: 'new', label: '🆕 New', color: 'bg-green-600', days: 0 };
    }
  };

  // Helper to check if item is done
  const isDone = (item) => item.completed || item.status === 'completed' || item.status === 'done';

  // Filter out items completed more than a week ago
  const isOlderThanWeek = (item) => {
    if (!isDone(item)) return false;
    const completedDate = item.completed_at || item.updated_at || item.created_at;
    if (!completedDate) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(completedDate) < weekAgo;
  };

  const activeTodoItems = todoItems.filter(item => !isOlderThanWeek(item));

  const counts = {
    all: activeTodoItems.length,
    pending: activeTodoItems.filter(i => !isDone(i) && i.status !== 'in_progress' && i.status !== 'working').length,
    in_progress: activeTodoItems.filter(i => i.status === 'in_progress' || i.status === 'working').length,
    completed: activeTodoItems.filter(i => isDone(i)).length
  };

  return (
    <div className="rounded-xl border border-[#D4A574]/30 overflow-hidden"
         data-testid="todo-list-container"
         style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(30,30,40,0.9) 100%)' }}>
      
      {/* Header */}
      <div 
        className="px-6 py-4 flex items-center justify-between border-b border-[#B49B7E]/20"
        style={{ background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(180, 155, 126, 0.1) 100%)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <h3 className="text-[#D4A574] font-bold text-lg">To-Do List</h3>
            <p className="text-gray-500 text-sm">
              {counts.pending} pending • {counts.completed} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            data-testid="add-todo-btn"
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-3 py-2 rounded-lg font-bold text-sm"
          >
            + Add Item
          </button>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex border-b border-[#B49B7E]/20">
        {['all', 'pending', 'in_progress', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            data-testid={`filter-${status}-btn`}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              filter === status 
                ? 'text-[#D4A574] border-b-2 border-[#D4A574] bg-[#D4A574]/10' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
            <span className="ml-2 text-xs opacity-70">({counts[status] || 0})</span>
          </button>
        ))}
      </div>
      
      {/* Add Form - MATCHING PUNCHLIST EXACTLY */}
      {showAddForm && (
        <div className="p-4 border-b border-[#B49B7E]/20 bg-black/30">
          <form onSubmit={createTodoItem} className="space-y-3">
            <input
              type="text"
              value={newItem.text}
              onChange={(e) => setNewItem(prev => ({ ...prev, text: e.target.value }))}
              placeholder="What needs to be done?"
              data-testid="todo-text-input"
              className="w-full px-4 py-3 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500 focus:border-[#D4A574] focus:outline-none"
              required
            />
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details (optional)"
              data-testid="todo-description-input"
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500 focus:border-[#D4A574] focus:outline-none resize-none"
            />
            
            {/* FFE Linking Section */}
            <div className="relative">
              <label className="text-xs text-[#D4A574] font-medium mb-1 block">
                🔗 Link to FFE/Checklist Item (Optional)
              </label>
              {selectedFfeItem ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#D4A574]/10 border border-[#D4A574]/50">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${selectedFfeItem.sourceType === 'CHECKLIST' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                    {selectedFfeItem.sourceType}
                  </span>
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm">{selectedFfeItem.name}</div>
                    <div className="text-gray-400 text-xs">
                      {selectedFfeItem.roomName} • {selectedFfeItem.vendor} • SKU: {selectedFfeItem.sku}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFfeItem(null);
                      setFfeSearchQuery('');
                    }}
                    className="text-red-400 hover:text-red-300 text-lg"
                  >
                    ✕
                  </button>
                </div>
              ) : ffeItems.length === 0 ? (
                <div className="px-4 py-3 rounded-lg bg-yellow-900/20 border border-yellow-600/30 text-yellow-400 text-sm">
                  ⚠️ No FFE items available. Add items to FFE spreadsheet or Checklist first.
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={ffeSearchQuery}
                    onChange={(e) => {
                      setFfeSearchQuery(e.target.value);
                      setShowFfeDropdown(true);
                    }}
                    onFocus={() => setShowFfeDropdown(true)}
                    placeholder={`Search ${ffeItems.length} items by name, SKU, vendor...`}
                    data-testid="ffe-search-input"
                    className="w-full px-4 py-3 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500 focus:border-[#D4A574] focus:outline-none"
                  />
                  {showFfeDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-[#B49B7E]/30 rounded-lg max-h-60 overflow-y-auto shadow-xl">
                      {filteredFfeItems.length > 0 ? (
                        filteredFfeItems.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedFfeItem(item);
                              setShowFfeDropdown(false);
                              setFfeSearchQuery('');
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-[#D4A574]/20 border-b border-[#B49B7E]/10 last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.sourceType === 'CHECKLIST' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                                {item.sourceType}
                              </span>
                              <span className="text-white font-medium text-sm">{item.name}</span>
                            </div>
                            <div className="text-gray-400 text-xs mt-1">
                              {item.roomName} • {item.vendor || 'No vendor'} • SKU: {item.sku || 'N/A'}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-400 text-sm">
                          {ffeSearchQuery ? 'No matching items found' : 'Type to search Checklist & FFE items...'}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 flex-wrap">
              <select
                value={newItem.priority}
                onChange={(e) => setNewItem(prev => ({ ...prev, priority: e.target.value }))}
                data-testid="priority-select"
                className="px-4 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
              <input
                type="text"
                value={newItem.assigned_to}
                onChange={(e) => setNewItem(prev => ({ ...prev, assigned_to: e.target.value }))}
                placeholder="Assign to (optional)"
                data-testid="assigned-to-input"
                className="flex-1 px-4 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500 focus:border-[#D4A574] focus:outline-none"
              />
              <input
                type="date"
                value={newItem.deadline}
                onChange={(e) => setNewItem(prev => ({ ...prev, deadline: e.target.value }))}
                data-testid="deadline-input"
                className="px-4 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                data-testid="submit-todo-btn"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
              >
                Add to To-Do List
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedFfeItem(null);
                  setFfeSearchQuery('');
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* To-Do Items List - MATCHING PUNCHLIST EXACTLY */}
      <div className="divide-y divide-[#B49B7E]/10">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading...</p>
        ) : activeTodoItems.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No to-do items yet.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-[#D4A574] hover:text-[#B49B7E]"
            >
              + Add your first item
            </button>
          </div>
        ) : (
          // SORT: Done items go to BOTTOM of the list
          [...activeTodoItems].sort((a, b) => {
            if (isDone(a) && !isDone(b)) return 1;
            if (!isDone(a) && isDone(b)) return -1;
            return 0;
          }).map(item => (
            <div 
              key={item.id} 
              data-testid={`todo-item-${item.id}`}
              className={`p-4 hover:bg-black/20 transition-colors ${
                isDone(item) ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Status Toggle */}
                <button
                  onClick={() => {
                    const nextStatus = {
                      pending: 'in_progress',
                      in_progress: 'done',
                      done: 'pending',
                      completed: 'pending',
                      completed: 'pending',
                      undefined: 'in_progress'
                    };
                    const newCompleted = nextStatus[item.status] === 'completed';
                    updateTodoItem(item.id, { 
                      status: nextStatus[item.status || 'pending'],
                      completed: newCompleted
                    });
                  }}
                  data-testid={`toggle-status-${item.id}`}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isDone(item)
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : 'border-gray-500 hover:border-[#D4A574]'
                  }`}
                >
                  {getStatusIcon(item.status, item.completed)}
                </button>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`font-medium ${
                      isDone(item) 
                        ? 'line-through text-gray-500' 
                        : 'text-white'
                    }`}>
                      {item.text}
                    </h4>
                    {/* STATUS - EDITABLE DROPDOWN */}
                    <select
                      value={item.status || 'pending'}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        const newCompleted = newStatus === 'done' || newStatus === 'completed';
                        updateTodoItem(item.id, { status: newStatus, completed: newCompleted });
                      }}
                      className={`text-xs px-2 py-0.5 rounded-full cursor-pointer border-none outline-none ${
                        isDone(item) ? 'bg-green-600 text-white' :
                        item.status === 'in_progress' || item.status === 'working' ? 'bg-blue-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}
                      style={{ background: 'inherit' }}
                    >
                      <option value="pending" className="bg-gray-800">⏳ Pending</option>
                      <option value="working" className="bg-gray-800">🔄 Working</option>
                      <option value="done" className="bg-gray-800">✅ Done</option>
                    </select>
                    {/* PRIORITY - EDITABLE DROPDOWN */}
                    <select
                      value={item.priority || 'medium'}
                      onChange={(e) => updateTodoItem(item.id, { priority: e.target.value })}
                      className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(item.priority)} text-white cursor-pointer border-none outline-none`}
                      style={{ background: 'inherit' }}
                    >
                      <option value="low" className="bg-gray-800">Low</option>
                      <option value="medium" className="bg-gray-800">Medium</option>
                      <option value="high" className="bg-gray-800">High</option>
                      <option value="urgent" className="bg-gray-800">Urgent</option>
                    </select>
                    {/* PRIORITY TIMER - Shows how long item has been open */}
                    {(() => {
                      const timePriority = getTimePriority(item.created_at);
                      // Don't show timer for done items
                      if (isDone(item)) return null;
                      return (
                        <span 
                          className={`text-xs px-2 py-0.5 rounded-full text-white ${timePriority.color}`}
                          title="Priority Timer - Items grow in urgency over time"
                        >
                          {timePriority.label}
                        </span>
                      );
                    })()}
                  </div>
                  
                  {item.description && (
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  {/* Linked FFE Item Display */}
                  {item.linked_ffe_item ? (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#D4A574]/10 border border-[#D4A574]/30">
                      <span className="text-[#D4A574]">🔗</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        (item.linked_ffe_item.source_type || item.linked_ffe_item.sourceType || '').toLowerCase() === 'checklist' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-green-600 text-white'
                      }`}>
                        {(item.linked_ffe_item.source_type || item.linked_ffe_item.sourceType || 'LINKED').toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#D4A574] text-sm font-medium truncate">
                          {item.linked_ffe_item.name}
                        </div>
                        <div className="text-gray-500 text-xs">
                          🏠 {item.linked_ffe_item.room_name || item.linked_ffe_item.roomName || 'N/A'} 
                          {(item.linked_ffe_item.category_name || item.linked_ffe_item.categoryName) && ` • 📁 ${item.linked_ffe_item.category_name || item.linked_ffe_item.categoryName}`}
                          {item.linked_ffe_item.vendor && ` • 🏪 ${item.linked_ffe_item.vendor}`}
                          {item.linked_ffe_item.sku && ` • # ${item.linked_ffe_item.sku}`}
                        </div>
                      </div>
                      <button
                        onClick={() => unlinkFfeFromTodo(item.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                        title="Unlink FFE item"
                      >
                        ✕
                      </button>
                    </div>
                  ) : linkingItemId === item.id ? (
                    <div className="mt-2 relative">
                      <input
                        type="text"
                        value={ffeSearchQuery}
                        onChange={(e) => {
                          setFfeSearchQuery(e.target.value);
                          setShowFfeDropdown(true);
                        }}
                        onFocus={() => setShowFfeDropdown(true)}
                        placeholder="Search FFE items..."
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white text-sm placeholder-gray-500 focus:border-[#D4A574] focus:outline-none"
                        autoFocus
                      />
                      {showFfeDropdown && filteredFfeItems.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-[#B49B7E]/30 rounded-lg max-h-40 overflow-y-auto shadow-xl">
                          {filteredFfeItems.map(ffeItem => (
                            <button
                              key={ffeItem.id}
                              onClick={() => linkTodoToFfe(item.id, ffeItem)}
                              className="w-full px-3 py-2 text-left hover:bg-[#D4A574]/20 border-b border-[#B49B7E]/10 last:border-b-0"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${ffeItem.sourceType === 'CHECKLIST' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                                  {ffeItem.sourceType}
                                </span>
                                <span className="text-white text-sm">{ffeItem.name}</span>
                              </div>
                              <div className="text-gray-400 text-xs mt-1">
                                {ffeItem.roomName} • {ffeItem.vendor || 'No vendor'}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setLinkingItemId(null);
                          setFfeSearchQuery('');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setLinkingItemId(item.id)}
                      className="mt-2 text-xs text-[#D4A574] hover:text-[#B49B7E] flex items-center gap-1"
                    >
                      🔗 Link to FFE Item
                    </button>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                    <span className={getStatusColor(item.status, item.completed)}>
                      {(item.status || 'pending').replace('_', ' ')}
                    </span>
                    {item.assigned_to && (
                      <span>👤 {item.assigned_to}</span>
                    )}
                    {item.deadline && (
                      <span className="text-amber-400">📅 {new Date(item.deadline).toLocaleDateString()}</span>
                    )}
                    <span>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* ADDITIONAL COMMENTS THREAD */}
                  <div className="mt-3 border-t border-stone-700 pt-3">
                    {/* Show existing comments */}
                    {item.comments && item.comments.length > 0 && (
                      <div className="mb-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleComments(item.id); }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          📝 {item.comments.length} comment{item.comments.length > 1 ? 's' : ''} {expandedComments[item.id] ? '▼' : '▶'}
                        </button>
                        {expandedComments[item.id] && (
                          <div className="mt-2 space-y-2 pl-3 border-l-2 border-cyan-600/30">
                            {item.comments.map((comment, idx) => (
                              <div key={comment.id || idx} className="text-sm bg-cyan-900/20 rounded-lg px-3 py-2">
                                <span className="text-cyan-300">{comment.text}</span>
                                <span className="text-gray-500 text-xs ml-2">
                                  {comment.created_at && new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Add comment button/form */}
                    {commentingId === item.id ? (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 px-3 py-2 text-sm rounded-lg bg-black/50 border border-cyan-600/50 text-white focus:outline-none focus:border-cyan-500"
                          autoFocus
                          onKeyPress={(e) => e.key === 'Enter' && addTodoComment(item.id)}
                        />
                        <button
                          onClick={() => addTodoComment(item.id)}
                          className="px-3 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setCommentingId(null); setNewComment(''); }}
                          className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCommentingId(item.id); }}
                        className="text-sm text-cyan-500 hover:text-cyan-400 font-medium"
                      >
                        + Add comment
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <button
                  onClick={() => deleteTodoItem(item.id)}
                  data-testid={`delete-todo-${item.id}`}
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
  );
}

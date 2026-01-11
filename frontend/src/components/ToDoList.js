import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

export default function ToDoList({ projectId }) {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [loading, setLoading] = useState(true);
  
  // FFE Linking states
  const [ffeItems, setFfeItems] = useState([]);
  const [ffeSearchQuery, setFfeSearchQuery] = useState('');
  const [showFfeDropdown, setShowFfeDropdown] = useState(false);
  const [selectedFfeItem, setSelectedFfeItem] = useState(null);
  const [linkingTodoId, setLinkingTodoId] = useState(null);

  useEffect(() => {
    if (projectId) {
      // Load todos
      axios.get(`${API_URL}/todos/${projectId}`)
        .then(response => {
          setTodos(response.data.todos || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
      
      // Load FFE and Checklist items for linking
      // FFE items take priority (load FFE FIRST so they appear at top)
      const loadItems = async () => {
        const itemsMap = new Map(); // Use Map to dedupe by ID, FFE takes priority
        
        // Load FFE FIRST so FFE items appear first
        for (const sheetType of ['ffe', 'checklist']) {
          try {
            const res = await fetch(`${API_URL}/projects/${projectId}?sheet_type=${sheetType}`);
            if (res.ok) {
              const data = await res.json();
              (data.rooms || []).forEach(room => {
                (room.categories || []).forEach(cat => {
                  (cat.subcategories || []).forEach(subCat => {
                    (subCat.items || []).forEach(item => {
                      // Only add if not already in map (FFE takes priority since loaded first)
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
          } catch (e) {}
        }
        setFfeItems(Array.from(itemsMap.values()));
      };
      loadItems();
    }
  }, [projectId]);

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
  }).slice(0, 10);

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await axios.post(`${API_URL}/todos`, {
        project_id: projectId,
        text: newTodo.trim(),
        priority: newPriority,
        completed: false,
        linked_ffe_item: selectedFfeItem ? {
          id: selectedFfeItem.id,
          name: selectedFfeItem.name,
          sku: selectedFfeItem.sku,
          vendor: selectedFfeItem.vendor,
          roomName: selectedFfeItem.roomName,
          sourceType: selectedFfeItem.sourceType
        } : null
      });
      setNewTodo('');
      setNewPriority('Medium');
      setSelectedFfeItem(null);
      setFfeSearchQuery('');
      // Reload todos
      const response = await axios.get(`${API_URL}/todos/${projectId}`);
      setTodos(response.data.todos || []);
    } catch (error) {
      alert('Failed to add to-do: ' + error.message);
    }
  };

  const linkTodoToFfe = async (todoId, ffeItem) => {
    try {
      await axios.put(`${API_URL}/todos/${todoId}`, {
        linked_ffe_item: {
          id: ffeItem.id,
          name: ffeItem.name,
          sku: ffeItem.sku,
          vendor: ffeItem.vendor,
          roomName: ffeItem.roomName,
          sourceType: ffeItem.sourceType
        }
      });
      setLinkingTodoId(null);
      setFfeSearchQuery('');
      const response = await axios.get(`${API_URL}/todos/${projectId}`);
      setTodos(response.data.todos || []);
    } catch (error) {
      console.error('Failed to link:', error);
    }
  };

  const unlinkFfeFromTodo = async (todoId) => {
    try {
      await axios.put(`${API_URL}/todos/${todoId}`, { linked_ffe_item: null });
      const response = await axios.get(`${API_URL}/todos/${projectId}`);
      setTodos(response.data.todos || []);
    } catch (error) {
      console.error('Failed to unlink:', error);
    }
  };

  const toggleTodo = async (todoId, completed) => {
    try {
      await axios.put(`${API_URL}/todos/${todoId}`, { completed: !completed });
      const response = await axios.get(`${API_URL}/todos/${projectId}`);
      setTodos(response.data.todos || []);
    } catch (error) {
      alert('Failed to update');
    }
  };

  const deleteTodo = async (todoId) => {
    if (!window.confirm('Delete this to-do?')) return;
    try {
      await axios.delete(`${API_URL}/todos/${todoId}`);
      const response = await axios.get(`${API_URL}/todos/${projectId}`);
      setTodos(response.data.todos || []);
    } catch (error) {
      alert('Failed to delete');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-white text-2xl">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#D4A574] mb-4">To-Do List</h2>
          <div className="flex gap-3">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="px-4 py-3 rounded-lg border-2 text-white focus:outline-none font-bold"
              style={{
                background: newPriority === 'High' ? '#EF4444' : newPriority === 'Low' ? '#10B981' : '#F59E0B',
                borderColor: newPriority === 'High' ? '#EF4444' : newPriority === 'Low' ? '#10B981' : '#F59E0B'
              }}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add new to-do item..."
              className="flex-1 px-4 py-3 rounded-lg border-2 border-[#D4A574] text-white focus:outline-none placeholder-[#D4C5A9]/70"
              style={{ background: 'rgba(0,0,0,0.8)' }}
            />
            <button onClick={addTodo} className="px-8 py-3 rounded-lg font-bold border-2 border-[#D4A574] text-black" style={{ background: 'linear-gradient(135deg, #D4A574 0%, #B49B7E 100%)' }}>
              ADD
            </button>
          </div>
          
          {/* FFE Link Option */}
          <div className="mt-3 relative">
            <div className="text-sm text-gray-400 mb-2">Link to Checklist/FFE Item (Optional)</div>
            {selectedFfeItem ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#D4A574]/10 border border-[#D4A574]/30">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${selectedFfeItem.sourceType === 'CHECKLIST' ? 'bg-blue-600' : 'bg-green-600'} text-white`}>
                  {selectedFfeItem.sourceType}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[#D4A574] text-sm font-medium truncate">{selectedFfeItem.name}</div>
                  <div className="text-gray-500 text-xs">{selectedFfeItem.roomName} • {selectedFfeItem.vendor}</div>
                </div>
                <button onClick={() => setSelectedFfeItem(null)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={ffeSearchQuery}
                  onChange={(e) => { setFfeSearchQuery(e.target.value); setShowFfeDropdown(true); }}
                  onFocus={() => setShowFfeDropdown(true)}
                  placeholder={ffeItems.length > 0 ? `Search ${ffeItems.length} items...` : "No items - add to Checklist or FFE first"}
                  disabled={ffeItems.length === 0}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white text-sm placeholder-gray-500 focus:border-[#D4A574] focus:outline-none disabled:opacity-50"
                />
                {showFfeDropdown && filteredFfeItems.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-[#B49B7E]/30 rounded-lg max-h-40 overflow-y-auto shadow-xl">
                    {filteredFfeItems.map(ffeItem => (
                      <button
                        key={ffeItem.id}
                        onClick={() => { setSelectedFfeItem(ffeItem); setShowFfeDropdown(false); setFfeSearchQuery(''); }}
                        className="w-full px-3 py-2 text-left hover:bg-[#D4A574]/20 border-b border-[#B49B7E]/10 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${ffeItem.sourceType === 'CHECKLIST' ? 'bg-blue-600' : 'bg-green-600'} text-white`}>
                            {ffeItem.sourceType}
                          </span>
                          <span className="text-white text-sm">{ffeItem.name}</span>
                        </div>
                        <div className="text-gray-400 text-xs mt-1">{ffeItem.roomName} • {ffeItem.vendor || 'No vendor'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* To-Do Items */}
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="text-center py-12 text-[#D4C5A9]">No to-do items yet</div>
          ) : (
            todos.map((todo) => (
              <div key={todo.id} className="p-4 rounded-lg border border-[#B49B7E]" style={{ background: todo.completed ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.8)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id, todo.completed)} className="w-5 h-5 cursor-pointer" />
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: todo.priority === 'High' ? '#EF4444' : todo.priority === 'Low' ? '#10B981' : '#F59E0B' }}>
                      {todo.priority}
                    </span>
                    <span className={`text-lg ${todo.completed ? 'line-through text-[#10B981]' : 'text-[#D4C5A9]'}`}>{todo.text}</span>
                  </div>
                  <button onClick={() => deleteTodo(todo.id)} className="text-red-400 hover:text-red-300 font-bold text-xl">🗑️</button>
                </div>
                
                {/* FFE Link for existing todos */}
                <div className="mt-3 ml-8">
                  {todo.linked_ffe_item ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#D4A574]/10 border border-[#D4A574]/30">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${todo.linked_ffe_item.sourceType === 'CHECKLIST' ? 'bg-blue-600' : 'bg-green-600'} text-white`}>
                        {todo.linked_ffe_item.sourceType || 'LINKED'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#D4A574] text-sm font-medium truncate">{todo.linked_ffe_item.name}</div>
                        <div className="text-gray-500 text-xs">{todo.linked_ffe_item.roomName} • {todo.linked_ffe_item.vendor}</div>
                      </div>
                      <button onClick={() => unlinkFfeFromTodo(todo.id)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                    </div>
                  ) : linkingTodoId === todo.id ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={ffeSearchQuery}
                        onChange={(e) => { setFfeSearchQuery(e.target.value); setShowFfeDropdown(true); }}
                        onFocus={() => setShowFfeDropdown(true)}
                        placeholder="Search items..."
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white text-sm placeholder-gray-500"
                        autoFocus
                      />
                      {showFfeDropdown && filteredFfeItems.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-[#B49B7E]/30 rounded-lg max-h-40 overflow-y-auto shadow-xl">
                          {filteredFfeItems.map(ffeItem => (
                            <button key={ffeItem.id} onClick={() => linkTodoToFfe(todo.id, ffeItem)} className="w-full px-3 py-2 text-left hover:bg-[#D4A574]/20 border-b border-[#B49B7E]/10 last:border-b-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${ffeItem.sourceType === 'CHECKLIST' ? 'bg-blue-600' : 'bg-green-600'} text-white`}>{ffeItem.sourceType}</span>
                                <span className="text-white text-sm">{ffeItem.name}</span>
                              </div>
                              <div className="text-gray-400 text-xs mt-1">{ffeItem.roomName} • {ffeItem.vendor || 'No vendor'}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      <button onClick={() => { setLinkingTodoId(null); setFfeSearchQuery(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setLinkingTodoId(todo.id)} className="text-xs text-[#D4A574] hover:text-[#B49B7E] flex items-center gap-1">
                      🔗 Link to Item
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

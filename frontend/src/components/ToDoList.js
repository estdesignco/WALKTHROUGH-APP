import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

export default function ToDoList({ projectId }) {
  console.log('🔥🔥🔥 ToDoList RENDER - projectId:', projectId);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [loading, setLoading] = useState(true);
  
  // FFE Linking states (same pattern as PunchList)
  const [ffeItems, setFfeItems] = useState([]);
  const [ffeSearchQuery, setFfeSearchQuery] = useState('');
  const [showFfeDropdown, setShowFfeDropdown] = useState(false);
  const [selectedFfeItem, setSelectedFfeItem] = useState(null);
  const [linkingTodoId, setLinkingTodoId] = useState(null);

  useEffect(() => {
    loadTodos();
    loadFfeItems();
  }, [projectId]);

  // Load ONLY Checklist AND FFE items for linking (NOT walkthrough)
  const loadFfeItems = async () => {
    console.log('🔥 ToDoList: loadFfeItems called with projectId:', projectId);
    try {
      const allItems = [];
      const sheetTypes = ['checklist', 'ffe'];
      
      for (const sheetType of sheetTypes) {
        try {
          const url = `${API_URL}/projects/${projectId}?sheet_type=${sheetType}`;
          console.log(`🔥 ToDoList: Fetching ${sheetType} from ${url}`);
          const res = await fetch(url);
          console.log(`🔥 ToDoList: ${sheetType} response status: ${res.status}`);
          if (res.ok) {
            const data = await res.json();
            console.log(`🔥 ToDoList: ${sheetType} returned ${data.rooms?.length || 0} rooms`);
            if (data.rooms) {
              data.rooms.forEach(room => {
                room.categories?.forEach(cat => {
                  cat.subcategories?.forEach(subCat => {
                    subCat.items?.forEach(item => {
                      console.log(`🔥 ToDoList: Found item "${item.name}" from ${sheetType}`);
                      allItems.push({
                        ...item,
                        roomName: room.name,
                        categoryName: cat.name,
                        sourceType: sheetType.toUpperCase()
                      });
                    });
                  });
                });
              });
            }
          }
        } catch (e) {
          console.error(`🔥 ToDoList: Error loading ${sheetType}:`, e);
        }
      }
      
      console.log(`🔥 ToDoList: Total items loaded: ${allItems.length}`);
      setFfeItems(allItems);
    } catch (error) {
      console.error('🔥 ToDoList: Failed to load items:', error);
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
  }).slice(0, 10);

  const loadTodos = async () => {
    try {
      const response = await axios.get(`${API_URL}/todos/${projectId}`);
      setTodos(response.data.todos || []);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setLoading(false);
    }
  };

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
          roomName: selectedFfeItem.roomName
        } : null
      });
      
      setNewTodo('');
      setNewPriority('Medium');
      setSelectedFfeItem(null);
      setFfeSearchQuery('');
      await loadTodos();
      alert('✅ To-Do added! Teams notification sent.');
    } catch (error) {
      alert('❌ Failed to add to-do: ' + error.message);
    }
  };

  // Link existing todo to FFE item
  const linkTodoToFfe = async (todoId, ffeItem) => {
    try {
      await axios.put(`${API_URL}/todos/${todoId}`, {
        linked_ffe_item: {
          id: ffeItem.id,
          name: ffeItem.name,
          sku: ffeItem.sku,
          vendor: ffeItem.vendor,
          roomName: ffeItem.roomName
        }
      });
      setLinkingTodoId(null);
      setFfeSearchQuery('');
      await loadTodos();
    } catch (error) {
      console.error('Failed to link todo to FFE:', error);
    }
  };

  // Unlink FFE from todo
  const unlinkFfeFromTodo = async (todoId) => {
    try {
      await axios.put(`${API_URL}/todos/${todoId}`, { linked_ffe_item: null });
      await loadTodos();
    } catch (error) {
      console.error('Failed to unlink FFE:', error);
    }
  };

  const toggleTodo = async (todoId, completed) => {
    try {
      await axios.put(`${API_URL}/todos/${todoId}`, { completed: !completed });
      await loadTodos();
    } catch (error) {
      alert('❌ Failed to update to-do');
    }
  };

  const deleteTodo = async (todoId) => {
    if (!window.confirm('Delete this to-do?')) return;
    try {
      await axios.delete(`${API_URL}/todos/${todoId}`);
      await loadTodos();
    } catch (error) {
      alert('❌ Failed to delete to-do');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-white text-2xl">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Add To-Do */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#D4A574] mb-4">📋 To-Do List</h2>
          <div className="flex gap-3">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="px-4 py-3 rounded-lg border-2 text-white focus:outline-none font-bold"
              style={{
                background: newPriority === 'High' 
                  ? 'linear-gradient(135deg, #EF4444FF 0%, #EF4444AA 50%, #EF4444FF 100%)'
                  : newPriority === 'Low'
                  ? 'linear-gradient(135deg, #10B981FF 0%, #10B981AA 50%, #10B981FF 100%)'
                  : 'linear-gradient(135deg, #F59E0BFF 0%, #F59E0BAA 50%, #F59E0BFF 100%)',
                borderColor: newPriority === 'High' ? '#EF4444' : newPriority === 'Low' ? '#10B981' : '#F59E0B',
                boxShadow: `0 0 15px ${newPriority === 'High' ? '#EF444450' : newPriority === 'Low' ? '#10B98150' : '#F59E0B50'}`
              }}
            >
              <option value="High">🔴 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add new to-do item..."
              className="flex-1 px-4 py-3 rounded-lg border-2 border-[#D4A574] text-white focus:outline-none placeholder-[#D4C5A9]/70"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.9) 50%, rgba(0,0,0,0.95) 100%)',
                boxShadow: '0 0 20px rgba(212, 165, 116, 0.3), inset 0 0 30px rgba(212, 165, 116, 0.08)'
              }}
            />
            <button
              onClick={addTodo}
              className="px-8 py-3 rounded-lg font-bold border-2 border-[#D4A574] text-black"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #B49B7E 50%, #D4A574 100%)',
                boxShadow: '0 0 20px rgba(212, 165, 116, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.15)'
              }}
            >
              ➕ ADD
            </button>
          </div>
          
          {/* FFE Link Option for New To-Do */}
          <div className="mt-3 relative">
            <div className="text-sm text-gray-400 mb-2">🔗 Link to FFE Item (Optional)</div>
            {selectedFfeItem ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#D4A574]/10 border border-[#D4A574]/30">
                <span className="text-[#D4A574]">🔗</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[#D4A574] text-sm font-medium truncate">{selectedFfeItem.name}</div>
                  <div className="text-gray-500 text-xs">{selectedFfeItem.roomName} • {selectedFfeItem.vendor}</div>
                </div>
                <button
                  onClick={() => setSelectedFfeItem(null)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  ✕
                </button>
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
                  placeholder={ffeItems.length > 0 ? "Search Checklist & FFE items to link..." : "No items available - add items to Checklist or FFE first"}
                  disabled={ffeItems.length === 0}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white text-sm placeholder-gray-500 focus:border-[#D4A574] focus:outline-none disabled:opacity-50"
                />
                {showFfeDropdown && filteredFfeItems.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-[#B49B7E]/30 rounded-lg max-h-40 overflow-y-auto shadow-xl">
                    {filteredFfeItems.map(ffeItem => (
                      <button
                        key={ffeItem.id}
                        onClick={() => {
                          setSelectedFfeItem(ffeItem);
                          setShowFfeDropdown(false);
                          setFfeSearchQuery('');
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#D4A574]/20 border-b border-[#B49B7E]/10 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${ffeItem.sourceType === 'CHECKLIST' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                            {ffeItem.sourceType}
                          </span>
                          <span className="text-white text-sm">{ffeItem.name}</span>
                        </div>
                        <div className="text-gray-400 text-xs mt-1">{ffeItem.roomName} • {ffeItem.vendor || 'No vendor'}</div>
                      </button>
                    ))}
                  </div>
                )}
                {ffeItems.length === 0 && (
                  <div className="text-xs text-yellow-500 mt-1">
                    ⚠️ No items available. Add items to Checklist or FFE first.
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
              <div
                key={todo.id}
                className="p-4 rounded-lg border border-[#B49B7E]"
                style={{
                  background: todo.completed 
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 50%, rgba(16,185,129,0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)',
                  boxShadow: todo.completed
                    ? '0 0 15px rgba(16,185,129,0.3), inset 0 0 25px rgba(16,185,129,0.1)'
                    : '0 0 10px rgba(212, 165, 116, 0.2), inset 0 0 20px rgba(212, 165, 116, 0.05)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id, todo.completed)}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-bold border"
                      style={{
                        background: todo.priority === 'High' 
                          ? 'linear-gradient(135deg, #EF4444FF 0%, #EF4444AA 50%, #EF4444FF 100%)'
                          : todo.priority === 'Low'
                          ? 'linear-gradient(135deg, #10B981FF 0%, #10B981AA 50%, #10B981FF 100%)'
                          : 'linear-gradient(135deg, #F59E0BFF 0%, #F59E0BAA 50%, #F59E0BFF 100%)',
                        borderColor: todo.priority === 'High' ? '#EF4444' : todo.priority === 'Low' ? '#10B981' : '#F59E0B',
                        color: 'white',
                        boxShadow: `0 0 10px ${todo.priority === 'High' ? '#EF444450' : todo.priority === 'Low' ? '#10B98150' : '#F59E0B50'}`
                      }}
                    >
                      {todo.priority === 'High' ? '🔴' : todo.priority === 'Low' ? '🟢' : '🟡'} {todo.priority}
                    </span>
                    <span className={`text-lg ${todo.completed ? 'line-through text-[#10B981]' : 'text-[#D4C5A9]'}`}>
                      {todo.text}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-400 hover:text-red-300 font-bold text-xl"
                  >
                    🗑️
                  </button>
                </div>
                
                {/* FFE Link Display/Add for existing todos */}
                <div className="mt-3 ml-8">
                  {todo.linked_ffe_item ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#D4A574]/10 border border-[#D4A574]/30">
                      <span className="text-[#D4A574]">🔗</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#D4A574] text-sm font-medium truncate">{todo.linked_ffe_item.name}</div>
                        <div className="text-gray-500 text-xs">
                          {todo.linked_ffe_item.roomName} • {todo.linked_ffe_item.vendor} • SKU: {todo.linked_ffe_item.sku}
                        </div>
                      </div>
                      <button
                        onClick={() => unlinkFfeFromTodo(todo.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                        title="Unlink FFE item"
                      >
                        ✕
                      </button>
                    </div>
                  ) : linkingTodoId === todo.id ? (
                    <div className="relative">
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
                              onClick={() => linkTodoToFfe(todo.id, ffeItem)}
                              className="w-full px-3 py-2 text-left hover:bg-[#D4A574]/20 border-b border-[#B49B7E]/10 last:border-b-0"
                            >
                              <div className="text-white text-sm">{ffeItem.name}</div>
                              <div className="text-gray-400 text-xs">{ffeItem.roomName} • {ffeItem.vendor || 'No vendor'}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setLinkingTodoId(null);
                          setFfeSearchQuery('');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setLinkingTodoId(todo.id)}
                      className="text-xs text-[#D4A574] hover:text-[#B49B7E] flex items-center gap-1"
                    >
                      🔗 Link to FFE Item
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

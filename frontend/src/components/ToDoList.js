import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function ToDoList({ projectId }) {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodos();
  }, [projectId]);

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
        completed: false
      });
      
      setNewTodo('');
      await loadTodos();
      alert('✅ To-Do added! Teams notification sent.');
    } catch (error) {
      alert('❌ Failed to add to-do: ' + error.message);
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
        </div>

        {/* To-Do Items */}
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="text-center py-12 text-[#D4C5A9]">No to-do items yet</div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="p-4 rounded-lg border border-[#B49B7E] flex items-center justify-between"
                style={{
                  background: todo.completed 
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 50%, rgba(16,185,129,0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)',
                  boxShadow: todo.completed
                    ? '0 0 15px rgba(16,185,129,0.3), inset 0 0 25px rgba(16,185,129,0.1)'
                    : '0 0 10px rgba(212, 165, 116, 0.2), inset 0 0 20px rgba(212, 165, 116, 0.05)'
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                    className="w-5 h-5 cursor-pointer"
                  />
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * PunchList - Manage punch list items for a project with AI suggestions
 * Now includes FFE linking feature to reference items from the FF&E spreadsheet
 */
export default function PunchList({ projectId, roomId = null }) {
  const [punchItems, setPunchItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, in_progress, completed
  
  // FFE Linking states
  const [ffeItems, setFfeItems] = useState([]);
  const [ffeSearchQuery, setFfeSearchQuery] = useState('');
  const [showFfeDropdown, setShowFfeDropdown] = useState(false);
  const [selectedFfeItem, setSelectedFfeItem] = useState(null);
  const [linkingItemId, setLinkingItemId] = useState(null); // For linking existing punch items
  
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    linked_ffe_item_id: null
  });

  useEffect(() => {
    loadPunchList();
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
        } catch (e) {}
      }
      
      console.log(`📦 PunchList: Loaded ${itemsMap.size} unique items (FFE priority)`);
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

  const loadPunchList = async () => {
    try {
      let url = `${API_URL}/punch-list/project/${projectId}`;
      if (filter && filter !== 'all') {
        url += `?status=${filter}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPunchItems(data.punch_items || []);
      }
    } catch (error) {
      console.error('Failed to load punch list:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPunchItem = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/punch-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          room_id: roomId,
          ...newItem,
          linked_ffe_item: selectedFfeItem ? {
            id: selectedFfeItem.id,
            name: selectedFfeItem.name,
            sku: selectedFfeItem.sku,
            vendor: selectedFfeItem.vendor,
            roomName: selectedFfeItem.roomName
          } : null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPunchItems(prev => [data.punch_item, ...prev]);
        setNewItem({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', linked_ffe_item_id: null });
        setSelectedFfeItem(null);
        setFfeSearchQuery('');
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Failed to create punch item:', error);
    }
  };

  // Link an existing punch item to an FFE item
  const linkPunchToFfe = async (punchItemId, ffeItem) => {
    try {
      const response = await fetch(`${API_URL}/punch-list/${punchItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linked_ffe_item: {
            id: ffeItem.id,
            name: ffeItem.name,
            sku: ffeItem.sku,
            vendor: ffeItem.vendor,
            roomName: ffeItem.roomName
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPunchItems(prev => prev.map(item => 
          item.id === punchItemId ? data.punch_item : item
        ));
        setLinkingItemId(null);
        setFfeSearchQuery('');
      }
    } catch (error) {
      console.error('Failed to link punch item to FFE:', error);
    }
  };

  // Unlink FFE from punch item
  const unlinkFfeFromPunch = async (punchItemId) => {
    try {
      const response = await fetch(`${API_URL}/punch-list/${punchItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linked_ffe_item: null })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPunchItems(prev => prev.map(item => 
          item.id === punchItemId ? data.punch_item : item
        ));
      }
    } catch (error) {
      console.error('Failed to unlink FFE:', error);
    }
  };

  const updatePunchItem = async (itemId, updates) => {
    try {
      const response = await fetch(`${API_URL}/punch-list/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const data = await response.json();
        setPunchItems(prev => prev.map(item => 
          item.id === itemId ? data.punch_item : item
        ));
      }
    } catch (error) {
      console.error('Failed to update punch item:', error);
    }
  };

  const deletePunchItem = async (itemId) => {
    if (!window.confirm('Delete this punch list item?')) return;
    
    try {
      const response = await fetch(`${API_URL}/punch-list/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setPunchItems(prev => prev.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Failed to delete punch item:', error);
    }
  };

  const generateAISuggestions = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/punch-list/ai-suggest/${projectId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.suggestions?.length > 0) {
          setPunchItems(prev => [...data.suggestions, ...prev]);
          alert(`✅ Generated ${data.count} AI suggestions!`);
        } else {
          alert('No suggestions generated. Try adding more items with notes first.');
        }
      }
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      alert('Failed to generate suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-600',
      medium: 'bg-cyan-600',  // CHANGED from yellow to cyan - too similar to "Modern Kitchen" color
      high: 'bg-orange-600',
      urgent: 'bg-red-600'
    };
    return colors[priority] || 'bg-gray-600';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-gray-400',
      in_progress: 'text-blue-400',
      completed: 'text-green-400',
      verified: 'text-purple-400'
    };
    return colors[status] || 'text-gray-400';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      in_progress: '🔄',
      completed: '✅',
      verified: '✓✓'
    };
    return icons[status] || '⏳';
  };

  const counts = {
    all: punchItems.length,
    pending: punchItems.filter(i => i.status === 'pending').length,
    in_progress: punchItems.filter(i => i.status === 'in_progress').length,
    completed: punchItems.filter(i => i.status === 'completed').length + punchItems.filter(i => i.status === 'verified').length
  };

  return (
    <div className="rounded-xl border border-[#D4A574]/30 overflow-hidden"
         style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(30,30,40,0.9) 100%)' }}>
      
      {/* Header */}
      <div 
        className="px-6 py-4 flex items-center justify-between border-b border-[#B49B7E]/20"
        style={{ background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(180, 155, 126, 0.1) 100%)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <h3 className="text-[#D4A574] font-bold text-lg">Punch List</h3>
            <p className="text-gray-500 text-sm">
              {counts.pending} pending • {counts.completed} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateAISuggestions}
            disabled={generating}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? '🔄' : '🤖'} AI Suggest
          </button>
          <button
            onClick={() => setShowAddForm(true)}
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
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              filter === status 
                ? 'text-[#D4A574] border-b-2 border-[#D4A574] bg-[#D4A574]/10' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
            <span className="ml-2 text-xs opacity-70">({counts[status]})</span>
          </button>
        ))}
      </div>
      
      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 border-b border-[#B49B7E]/20 bg-black/30">
          <form onSubmit={createPunchItem} className="space-y-3">
            <input
              type="text"
              value={newItem.title}
              onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500 focus:border-[#D4A574] focus:outline-none"
              required
            />
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details (optional)"
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500 focus:border-[#D4A574] focus:outline-none resize-none"
            />
            
            {/* FFE Linking Section */}
            <div className="relative">
              <label className="text-xs text-[#D4A574] font-medium mb-1 block">
                🔗 Link to FFE Item (Optional)
              </label>
              {selectedFfeItem ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#D4A574]/10 border border-[#D4A574]/50">
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
                  ⚠️ No FFE items available. Transfer items from Checklist to FFE first, or add items to FFE spreadsheet.
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
                    placeholder={`Search ${ffeItems.length} FFE items by name, SKU, vendor...`}
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
                className="flex-1 px-4 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500 focus:border-[#D4A574] focus:outline-none"
              />
              <input
                type="date"
                value={newItem.due_date}
                onChange={(e) => setNewItem(prev => ({ ...prev, due_date: e.target.value }))}
                data-testid="punch-deadline-input"
                className="px-4 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white focus:border-[#D4A574] focus:outline-none"
                title="Deadline"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
              >
                Add to Punch List
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
      
      {/* Punch Items List */}
      <div className="divide-y divide-[#B49B7E]/10">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Loading...</p>
        ) : punchItems.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No punch list items yet.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-[#D4A574] hover:text-[#B49B7E]"
            >
              + Add your first item
            </button>
          </div>
        ) : (
          punchItems.map(item => (
            <div 
              key={item.id} 
              className={`p-4 hover:bg-black/20 transition-colors ${
                item.status === 'completed' || item.status === 'verified' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Status Toggle */}
                <button
                  onClick={() => {
                    const nextStatus = {
                      pending: 'in_progress',
                      in_progress: 'completed',
                      completed: 'verified',
                      verified: 'pending'
                    };
                    updatePunchItem(item.id, { status: nextStatus[item.status] });
                  }}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                    item.status === 'completed' || item.status === 'verified'
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : 'border-gray-500 hover:border-[#D4A574]'
                  }`}
                >
                  {getStatusIcon(item.status)}
                </button>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`font-medium ${
                      item.status === 'completed' || item.status === 'verified' 
                        ? 'line-through text-gray-500' 
                        : 'text-white'
                    }`}>
                      {item.title}
                    </h4>
                    {/* PRIORITY - EDITABLE DROPDOWN */}
                    <select
                      value={item.priority || 'medium'}
                      onChange={(e) => updatePunchItem(item.id, { priority: e.target.value })}
                      className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(item.priority)} text-white cursor-pointer border-none outline-none`}
                      style={{ background: 'inherit' }}
                    >
                      <option value="low" className="bg-gray-800">Low</option>
                      <option value="medium" className="bg-gray-800">Medium</option>
                      <option value="high" className="bg-gray-800">High</option>
                      <option value="urgent" className="bg-gray-800">Urgent</option>
                    </select>
                    {item.ai_suggested && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-300">
                        🤖 AI
                      </span>
                    )}
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
                      <div className="flex-1 min-w-0">
                        <div className="text-[#D4A574] text-sm font-medium truncate">
                          {item.linked_ffe_item.name}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {item.linked_ffe_item.roomName} • {item.linked_ffe_item.vendor} • SKU: {item.linked_ffe_item.sku}
                        </div>
                      </div>
                      <button
                        onClick={() => unlinkFfeFromPunch(item.id)}
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
                              onClick={() => linkPunchToFfe(item.id, ffeItem)}
                              className="w-full px-3 py-2 text-left hover:bg-[#D4A574]/20 border-b border-[#B49B7E]/10 last:border-b-0"
                            >
                              <div className="text-white text-sm">{ffeItem.name}</div>
                              <div className="text-gray-400 text-xs">
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
                    <span className={getStatusColor(item.status)}>
                      {item.status.replace('_', ' ')}
                    </span>
                    {item.assigned_to && (
                      <span>👤 {item.assigned_to}</span>
                    )}
                    {item.due_date && (
                      <span className="text-amber-400">📅 {new Date(item.due_date).toLocaleDateString()}</span>
                    )}
                    <span>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <button
                  onClick={() => deletePunchItem(item.id)}
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

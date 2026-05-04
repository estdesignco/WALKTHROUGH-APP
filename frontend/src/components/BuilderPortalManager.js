import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

export default function BuilderPortalManager({ project, onReload }) {
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState(new Set());
  const [scopeEntries, setScopeEntries] = useState([]);
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [changeOrders, setChangeOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [showNewChange, setShowNewChange] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customTrades, setCustomTrades] = useState([]);
  const [newTradeName, setNewTradeName] = useState('');

  const DEFAULT_TRADES = ['DEMOLITION','FRAMING','ELECTRICAL','PLUMBING','HVAC','DRYWALL','PAINT','TILE','FLOORING','CABINETRY','COUNTERTOPS','MILLWORK','HARDWARE','GLASS & MIRRORS','APPLIANCES','FIXTURES','ROOFING','EXTERIOR','LANDSCAPING','GENERAL'];
  const allTrades = [...DEFAULT_TRADES, ...customTrades];

  useEffect(() => {
    loadPortal();
  }, [project?.id]);

  const loadPortal = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/builder-portal/project/${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setPortal(data);
        setSelectedRooms(new Set(data.selected_room_ids || []));
        setScopeEntries(data.scope_of_work || []);
        setScheduleEntries(data.schedule || []);
        setChangeOrders(data.change_orders || []);
        setContacts(data.contacts || []);
        setCustomTrades(data.custom_trades || []);
      }
    } catch (err) {
      // No portal yet
    } finally {
      setLoading(false);
    }
  };

  const createPortal = async () => {
    const res = await fetch(`${API_URL}/api/builder-portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: project.id,
        selected_room_ids: Array.from(selectedRooms),
        scope_of_work: scopeEntries,
        schedule: scheduleEntries,
        contacts: contacts,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setPortal(data);
    }
  };

  const updatePortal = async (updates) => {
    if (!portal) return;
    const res = await fetch(`${API_URL}/api/builder-portal/${portal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      setPortal(data);
    }
  };

  const toggleRoom = (roomId) => {
    setSelectedRooms(prev => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId); else next.add(roomId);
      return next;
    });
  };

  const saveRoomSelection = () => {
    if (portal) {
      updatePortal({ selected_room_ids: Array.from(selectedRooms) });
    }
  };

  const saveScope = () => updatePortal({ scope_of_work: scopeEntries });
  const saveSchedule = () => updatePortal({ schedule: scheduleEntries });
  const saveChanges = () => updatePortal({ change_orders: changeOrders });
  const saveContacts = () => updatePortal({ contacts: contacts });

  const portalUrl = portal ? `${window.location.origin}/builder/${portal.access_code}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rooms = project?.rooms || [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#D4A574]">Builder Portal</h2>
          <p className="text-sm text-gray-400">Share project info with your builder/contractor</p>
        </div>
        {!portal && (
          <button
            onClick={createPortal}
            data-testid="create-builder-portal-btn"
            className="px-6 py-3 rounded-lg font-bold text-black"
            style={{ background: 'linear-gradient(135deg, #D4A574, #B49B7E)' }}
          >
            CREATE BUILDER PORTAL
          </button>
        )}
      </div>

      {/* PORTAL LINK */}
      {portal && (
        <div className="p-4 rounded-lg border-2 border-[#D4A574] bg-[#1a1f2e]">
          <p className="text-xs text-[#D4A574] font-bold tracking-wider mb-2">BUILDER ACCESS LINK</p>
          <div className="flex gap-2 items-center">
            <input
              readOnly
              value={portalUrl}
              data-testid="builder-portal-url"
              className="flex-1 bg-black/40 border border-[#2a3040] rounded px-3 py-2 text-[#F5F5DC] text-sm"
              onClick={e => e.target.select()}
            />
            <button
              onClick={copyLink}
              className="px-4 py-2 rounded font-bold text-sm"
              style={{ background: copied ? '#10B981' : '#D4A574', color: '#1a1f2e' }}
            >
              {copied ? 'COPIED!' : 'COPY LINK'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Code: {portal.access_code} — Share this link with your builder</p>
        </div>
      )}

      {/* ROOM SELECTION */}
      <div className="p-4 rounded-lg bg-[#1a1f2e] border border-[#2a3040]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[#D4A574] font-bold text-sm tracking-wider">SELECT ROOMS FOR BUILDER</h3>
          {portal && (
            <button onClick={saveRoomSelection} className="px-3 py-1 rounded text-xs font-bold bg-[#D4A574] text-black">SAVE SELECTION</button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => toggleRoom(room.id)}
              className="px-3 py-2 rounded text-sm font-bold transition-all"
              style={{
                background: selectedRooms.has(room.id) ? room.color || '#D4A574' : '#2a3040',
                color: selectedRooms.has(room.id) ? '#fff' : '#6B7280',
                border: selectedRooms.has(room.id) ? '2px solid #fff' : '2px solid #374151',
              }}
            >
              {selectedRooms.has(room.id) ? '✓ ' : ''}{room.name}
            </button>
          ))}
        </div>
      </div>

      {/* SCOPE OF WORK - ITEMIZED */}
      <ScopeOfWorkSection
        scopeEntries={scopeEntries}
        setScopeEntries={setScopeEntries}
        rooms={rooms}
        allTrades={allTrades}
        customTrades={customTrades}
        setCustomTrades={setCustomTrades}
        newTradeName={newTradeName}
        setNewTradeName={setNewTradeName}
        portal={portal}
        saveScope={saveScope}
        apiUrl={API_URL}
      />

      {/* SCHEDULE */}
      <div className="p-4 rounded-lg bg-[#1a1f2e] border border-[#2a3040]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[#D4A574] font-bold text-sm tracking-wider">SCHEDULE & TIMELINE</h3>
          <div className="flex gap-2">
            <button onClick={() => setScheduleEntries(prev => [...prev, { title: '', date: '', status: 'pending', notes: '' }])} className="px-3 py-1 rounded text-xs font-bold bg-[#374151] text-white">+ ADD</button>
            {portal && <button onClick={saveSchedule} className="px-3 py-1 rounded text-xs font-bold bg-[#D4A574] text-black">SAVE</button>}
          </div>
        </div>
        {scheduleEntries.map((s, i) => (
          <div key={i} className="mb-3 p-3 bg-black/30 rounded">
            <div className="flex gap-2 items-center mb-2">
              <input value={s.title} onChange={e => { const n = [...scheduleEntries]; n[i].title = e.target.value; setScheduleEntries(n); }}
                placeholder="Milestone" className="flex-1 bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#F5F5DC] text-sm" />
              <input type="date" value={s.date} onChange={e => { const n = [...scheduleEntries]; n[i].date = e.target.value; setScheduleEntries(n); }}
                className="bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#F5F5DC] text-sm" />
              <select value={s.status} onChange={e => { const n = [...scheduleEntries]; n[i].status = e.target.value; setScheduleEntries(n); }}
                className="bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#F5F5DC] text-xs">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button onClick={() => setScheduleEntries(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 text-xs">X</button>
            </div>
            <div className="flex gap-2 mt-1">
              <select onChange={e => { if (e.target.value) { const n = [...scheduleEntries]; n[i].tagged_products = [...(n[i].tagged_products||[]), e.target.value]; setScheduleEntries(n); } e.target.value=''; }}
                className="bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-blue-300 text-xs">
                <option value="">Tag product...</option>
                {rooms.flatMap(r => r.categories?.flatMap(c => c.subcategories?.flatMap(sub => sub.items?.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({r.name})</option>
                )))) || [])}
              </select>
              <select onChange={e => { if (e.target.value) { const n = [...scheduleEntries]; n[i].tagged_people = [...(n[i].tagged_people||[]), e.target.value]; setScheduleEntries(n); } e.target.value=''; }}
                className="bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#D4A574] text-xs">
                <option value="">Tag person...</option>
                {(portal?.contacts||[]).map((c,ci) => <option key={ci} value={c.username||c.name}>@{c.username||c.name} ({c.role})</option>)}
              </select>
            </div>
            {(s.tagged_products||[]).length > 0 && <div className="flex flex-wrap gap-1 mt-1">{s.tagged_products.map((p,pi) => <span key={pi} className="text-[10px] bg-blue-900/30 text-blue-300 border border-blue-600 px-2 py-0.5 rounded">{p}</span>)}</div>}
            {(s.tagged_people||[]).length > 0 && <div className="flex flex-wrap gap-1 mt-1">{s.tagged_people.map((p,pi) => <span key={pi} className="text-[10px] bg-[#D4A574]/20 text-[#D4A574] border border-[#D4A574] px-2 py-0.5 rounded">@{p}</span>)}</div>}
          </div>
        ))}
      </div>

      {/* CHANGE ORDERS */}
      <div className="p-4 rounded-lg bg-[#1a1f2e] border border-[#2a3040]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[#D4A574] font-bold text-sm tracking-wider">CHANGE ORDERS</h3>
          <div className="flex gap-2">
            <button onClick={() => setChangeOrders(prev => [...prev, { title: '', date: new Date().toISOString().split('T')[0], description: '' }])} className="px-3 py-1 rounded text-xs font-bold bg-[#374151] text-white">+ ADD</button>
            {portal && <button onClick={saveChanges} className="px-3 py-1 rounded text-xs font-bold bg-[#D4A574] text-black">SAVE</button>}
          </div>
        </div>
        {changeOrders.map((co, i) => (
          <div key={i} className="mb-2 p-3 bg-black/30 rounded border-l-4 border-yellow-500">
            <div className="flex gap-2 mb-2">
              <input value={co.title} onChange={e => { const n = [...changeOrders]; n[i].title = e.target.value; setChangeOrders(n); }}
                placeholder="Change order title" className="flex-1 bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#F5F5DC] text-sm" />
              <input type="date" value={co.date} onChange={e => { const n = [...changeOrders]; n[i].date = e.target.value; setChangeOrders(n); }}
                className="bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#F5F5DC] text-sm" />
            </div>
            <RichTextEditor
              value={co.description}
              onChange={(val) => { const n = [...changeOrders]; n[i].description = val; setChangeOrders(n); }}
              placeholder="Description..."
            />
            <div className="flex gap-2 mt-2">
              <select onChange={e => { if (e.target.value) { const n = [...changeOrders]; n[i].tagged_products = [...(n[i].tagged_products||[]), e.target.value]; setChangeOrders(n); } e.target.value=''; }}
                className="bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-blue-300 text-xs">
                <option value="">Tag product...</option>
                {rooms.flatMap(r => r.categories?.flatMap(c => c.subcategories?.flatMap(sub => sub.items?.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({r.name})</option>
                )))) || [])}
              </select>
              <select onChange={e => { if (e.target.value) { const n = [...changeOrders]; n[i].tagged_people = [...(n[i].tagged_people||[]), e.target.value]; setChangeOrders(n); } e.target.value=''; }}
                className="bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#D4A574] text-xs">
                <option value="">Tag person...</option>
                {(portal?.contacts||[]).map((c,ci) => <option key={ci} value={c.username||c.name}>@{c.username||c.name} ({c.role})</option>)}
              </select>
            </div>
            {(co.tagged_products||[]).length > 0 && <div className="flex flex-wrap gap-1 mt-1">{co.tagged_products.map((p,pi) => <span key={pi} className="text-[10px] bg-blue-900/30 text-blue-300 border border-blue-600 px-2 py-0.5 rounded">{p}</span>)}</div>}
            {(co.tagged_people||[]).length > 0 && <div className="flex flex-wrap gap-1 mt-1">{co.tagged_people.map((p,pi) => <span key={pi} className="text-[10px] bg-[#D4A574]/20 text-[#D4A574] border border-[#D4A574] px-2 py-0.5 rounded">@{p}</span>)}</div>}
            <button onClick={() => setChangeOrders(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 text-xs mt-1">Remove</button>
          </div>
        ))}
      </div>

      {/* CONTACTS */}
      <div className="p-4 rounded-lg bg-[#1a1f2e] border border-[#2a3040]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[#D4A574] font-bold text-sm tracking-wider">PROJECT CONTACTS</h3>
          <div className="flex gap-2">
            <button onClick={() => setContacts(prev => [...prev, { name: '', role: '', phone: '', email: '' }])} className="px-3 py-1 rounded text-xs font-bold bg-[#374151] text-white">+ ADD</button>
            {portal && <button onClick={saveContacts} className="px-3 py-1 rounded text-xs font-bold bg-[#D4A574] text-black">SAVE</button>}
          </div>
        </div>
        {contacts.map((c, i) => (
          <div key={i} className="mb-2 flex gap-2 items-center flex-wrap">
            <input value={c.name} onChange={e => { const n = [...contacts]; n[i].name = e.target.value; setContacts(n); }}
              placeholder="Name" className="flex-1 min-w-[120px] bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#F5F5DC] text-sm" />
            <input value={c.role} onChange={e => { const n = [...contacts]; n[i].role = e.target.value; setContacts(n); }}
              placeholder="Role" className="w-[120px] bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#F5F5DC] text-sm" />
            <input value={c.phone} onChange={e => { const n = [...contacts]; n[i].phone = e.target.value; setContacts(n); }}
              placeholder="Phone" className="w-[130px] bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#F5F5DC] text-sm" />
            <input value={c.email} onChange={e => { const n = [...contacts]; n[i].email = e.target.value; setContacts(n); }}
              placeholder="Email" className="w-[180px] bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#F5F5DC] text-sm" />
            <button onClick={() => setContacts(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 text-xs">X</button>
          </div>
        ))}
      </div>

      {/* COMMENTS FROM BUILDER */}
      {portal && (portal.comments || []).length > 0 && (
        <div className="p-4 rounded-lg bg-[#1a1f2e] border border-[#2a3040]">
          <h3 className="text-[#D4A574] font-bold text-sm tracking-wider mb-3">BUILDER COMMENTS</h3>
          {portal.comments.map(c => (
            <div key={c.id} className="mb-2 p-3 bg-black/30 rounded border-l-3 border-[#D4A574]" style={{ borderLeft: '3px solid #D4A574' }}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#D4A574] font-bold">{c.author}</span>
                <span className="text-gray-500">{c.section} • {new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-[#E5E7EB] text-sm">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SCOPE OF WORK SECTION (Itemized rows, each with own metadata)
// ============================================================
function ScopeOfWorkSection({ scopeEntries, setScopeEntries, rooms, allTrades, customTrades, setCustomTrades, newTradeName, setNewTradeName, portal, saveScope, apiUrl }) {
  // Auto-fill room/trade from previous row when adding (so user doesn't re-select)
  const lastRoom = scopeEntries.length > 0 ? scopeEntries[scopeEntries.length - 1].room_id : '';
  const lastTrade = scopeEntries.length > 0 ? scopeEntries[scopeEntries.length - 1].trade_category : '';

  const addItem = (atIndex = null, presetRoom = null, presetTrade = null) => {
    const newItem = {
      room_id: presetRoom !== null ? presetRoom : lastRoom,
      trade_category: presetTrade !== null ? presetTrade : lastTrade,
      description: '',
      tagged_products: [],
      tagged_people: [],
      completed: false,
    };
    if (atIndex === null) {
      setScopeEntries([...scopeEntries, newItem]);
    } else {
      const next = [...scopeEntries];
      next.splice(atIndex + 1, 0, newItem);
      setScopeEntries(next);
    }
  };

  const updateItem = (i, patch) => {
    const n = [...scopeEntries];
    n[i] = { ...n[i], ...patch };
    setScopeEntries(n);
  };

  const removeItem = (i) => setScopeEntries(scopeEntries.filter((_, idx) => idx !== i));

  const moveItem = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= scopeEntries.length) return;
    const n = [...scopeEntries];
    [n[i], n[j]] = [n[j], n[i]];
    setScopeEntries(n);
  };

  // Detect items with multi-line/numbered content (legacy entries) for "Split into items" helper
  const hasMultipleLines = (html) => {
    if (!html) return false;
    // Strip HTML tags and check if there are 2+ non-empty lines, or a numbered/bulleted list
    const text = html.replace(/<[^>]*>/g, '\n').split('\n').map(s => s.trim()).filter(Boolean);
    if (text.length >= 2) return true;
    // Detect numbered patterns "1. ... 2. ..." inside one line
    const numbered = (html.match(/\d+\.\s+/g) || []).length;
    return numbered >= 2;
  };

  const splitIntoItems = (i) => {
    const entry = scopeEntries[i];
    if (!entry?.description) return;
    // Parse HTML — extract <li> items first, else split by <p>/<br>/newlines
    const html = entry.description;
    let lines = [];
    // Try <li> extraction
    const liMatches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
    if (liMatches.length >= 2) {
      lines = liMatches.map(m => m[1].trim()).filter(Boolean);
    } else {
      // Split by paragraph/break
      const parts = html.split(/<\/p>|<br\s*\/?>/i)
        .map(s => s.replace(/<p[^>]*>/i, '').trim())
        .map(s => s.replace(/^<[^>]+>|<[^>]+>$/g, '').trim())
        .filter(s => s && s.replace(/<[^>]*>/g, '').trim());
      // Strip leading "1. ", "2. ", "- ", "• " etc.
      lines = parts.map(s => s.replace(/^(\d+[.)]\s*|[-•]\s*)/, '').trim()).filter(Boolean);
    }
    if (lines.length < 2) return;
    const newItems = lines.map(line => ({
      room_id: entry.room_id,
      trade_category: entry.trade_category,
      description: line.startsWith('<') ? line : `<p>${line}</p>`,
      tagged_products: [],
      tagged_people: [],
      completed: false,
    }));
    const next = [...scopeEntries];
    next.splice(i, 1, ...newItems);
    setScopeEntries(next);
  };

  const addCustomTrade = () => {
    const t = newTradeName.trim().toUpperCase();
    if (!t || allTrades.includes(t)) { setNewTradeName(''); return; }
    const updated = [...customTrades, t];
    setCustomTrades(updated);
    if (portal) {
      fetch(`${apiUrl}/api/builder-portal/${portal.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_trades: updated }),
      });
    }
    setNewTradeName('');
  };

  const removeCustomTrade = (idx) => {
    const updated = customTrades.filter((_, i) => i !== idx);
    setCustomTrades(updated);
    if (portal) {
      fetch(`${apiUrl}/api/builder-portal/${portal.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_trades: updated }),
      });
    }
  };

  // Trade colors (must match builder portal)
  const tradeColors = {
    'DEMOLITION': '#EF4444', 'FRAMING': '#F97316', 'ELECTRICAL': '#EAB308', 'PLUMBING': '#3B82F6',
    'HVAC': '#6366F1', 'DRYWALL': '#A3A3A3', 'PAINT': '#EC4899', 'TILE': '#14B8A6', 'FLOORING': '#8B5CF6',
    'CABINETRY': '#D97706', 'COUNTERTOPS': '#7C3AED', 'MILLWORK': '#B45309', 'HARDWARE': '#78716C',
    'GLASS & MIRRORS': '#06B6D4', 'APPLIANCES': '#64748B', 'FIXTURES': '#0EA5E9', 'ROOFING': '#DC2626',
    'EXTERIOR': '#059669', 'LANDSCAPING': '#16A34A', 'GENERAL': '#6B7280',
  };

  // Flatten product list from rooms once
  const allProducts = rooms.flatMap(r =>
    (r.categories || []).flatMap(c =>
      (c.subcategories || []).flatMap(sub =>
        (sub.items || []).map(item => ({ id: item.id, name: item.name, room: r.name }))
      )
    )
  );

  // Filter view (only used when many items)
  const [filterRoom, setFilterRoom] = useState('');
  const [filterTrade, setFilterTrade] = useState('');

  // Group items by room (preserving each item's index in the original array for updates)
  const itemsByRoom = {};
  scopeEntries.forEach((item, idx) => {
    if (filterRoom && item.room_id !== filterRoom) return;
    if (filterTrade && (item.trade_category || '') !== filterTrade) return;
    const key = item.room_id || '__unassigned__';
    if (!itemsByRoom[key]) itemsByRoom[key] = [];
    itemsByRoom[key].push({ item, originalIndex: idx });
  });

  // Determine room order: rooms in project order that have items, then unassigned
  const orderedRoomKeys = [
    ...rooms.filter(r => itemsByRoom[r.id]).map(r => r.id),
    ...(itemsByRoom['__unassigned__'] ? ['__unassigned__'] : []),
  ];

  // Rooms not yet used (for "Add Room Section" dropdown)
  const unusedRooms = rooms.filter(r => !itemsByRoom[r.id]);

  return (
    <div className="p-4 rounded-lg bg-[#1a1f2e] border border-[#2a3040]" data-testid="scope-of-work-section">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-[#D4A574] font-bold text-sm tracking-wider">SCOPE OF WORK</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">One unified document. Each line is individually taggable.</p>
        </div>
        <div className="flex gap-2">
          {portal && <button onClick={saveScope} data-testid="save-scope-btn" className="px-3 py-1 rounded text-xs font-bold bg-[#10B981] text-white">SAVE</button>}
        </div>
      </div>

      {/* CUSTOM TRADE */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <input
          value={newTradeName}
          onChange={e => setNewTradeName(e.target.value.toUpperCase())}
          placeholder="Add custom trade (e.g. POOL, SECURITY)..."
          data-testid="custom-trade-input"
          className="flex-1 min-w-[200px] bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-yellow-400 text-xs"
          onKeyDown={e => { if (e.key === 'Enter') addCustomTrade(); }}
        />
        <button onClick={addCustomTrade} data-testid="add-custom-trade-btn" className="px-3 py-1 rounded text-xs font-bold bg-yellow-600/30 text-yellow-400 border border-yellow-600/30">+ TRADE</button>
        {customTrades.length > 0 && (
          <div className="flex flex-wrap gap-1 w-full">
            {customTrades.map((t, i) => (
              <span key={i} className="text-[10px] bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 px-2 py-0.5 rounded flex items-center gap-1">
                {t}
                <span className="cursor-pointer text-red-400 ml-1 font-bold" onClick={() => removeCustomTrade(i)}>×</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* FILTER (shown only when many items) */}
      {scopeEntries.length > 8 && (
        <div className="flex gap-2 mb-3 items-center text-xs">
          <span className="text-gray-500">Filter:</span>
          <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)} className="bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#D4A574]">
            <option value="">All Rooms</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={filterTrade} onChange={e => setFilterTrade(e.target.value)} className="bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-yellow-400">
            <option value="">All Trades</option>
            {allTrades.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {(filterRoom || filterTrade) && (
            <button onClick={() => { setFilterRoom(''); setFilterTrade(''); }} className="text-red-400 underline">Clear</button>
          )}
        </div>
      )}

      {/* GROUPED DOCUMENT */}
      {scopeEntries.length === 0 ? (
        <div className="p-8 text-center bg-black/20 rounded border border-dashed border-[#2a3040]">
          <p className="text-gray-400 text-sm mb-3">No scope items yet. Pick a room to start.</p>
          {rooms.length > 0 && (
            <select
              onChange={e => { if (e.target.value) addItem(null, e.target.value, ''); e.target.value = ''; }}
              className="bg-[#0f1218] border border-[#2a3040] rounded px-3 py-2 text-[#D4A574] text-sm font-bold"
              data-testid="add-first-room-select"
            >
              <option value="">+ ADD SCOPE FOR A ROOM...</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {orderedRoomKeys.map(roomKey => {
            const room = rooms.find(r => r.id === roomKey);
            const groupItems = itemsByRoom[roomKey];
            const headerColor = room?.color || '#D4A574';
            const headerName = room?.name || 'UNASSIGNED';
            return (
              <RoomGroup
                key={roomKey}
                room={room}
                roomKey={roomKey}
                headerColor={headerColor}
                headerName={headerName}
                groupItems={groupItems}
                rooms={rooms}
                allTrades={allTrades}
                allProducts={allProducts}
                contacts={portal?.contacts || []}
                tradeColors={tradeColors}
                onUpdate={updateItem}
                onRemove={removeItem}
                onMoveUp={(i) => moveItem(i, -1)}
                onMoveDown={(i) => moveItem(i, 1)}
                onAddItem={() => addItem(null, roomKey === '__unassigned__' ? '' : roomKey, lastTrade)}
                onSplit={splitIntoItems}
                hasMultipleLines={hasMultipleLines}
                totalItems={scopeEntries.length}
              />
            );
          })}

          {/* Add another room section */}
          {unusedRooms.length > 0 && (
            <div className="pt-2">
              <select
                onChange={e => { if (e.target.value) addItem(null, e.target.value, ''); e.target.value = ''; }}
                className="bg-[#0f1218] border-2 border-dashed border-[#D4A574]/40 rounded px-3 py-2 text-[#D4A574] text-sm font-bold w-full hover:border-[#D4A574]"
                data-testid="add-room-section-select"
              >
                <option value="">+ ADD ROOM SECTION...</option>
                {unusedRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Group of items under a single room header
function RoomGroup({ room, roomKey, headerColor, headerName, groupItems, rooms, allTrades, allProducts, contacts, tradeColors, onUpdate, onRemove, onMoveUp, onMoveDown, onAddItem, onSplit, hasMultipleLines, totalItems }) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${headerColor}10 0%, transparent 100%)`, border: `1px solid ${headerColor}30` }}
      data-testid={`scope-room-group-${roomKey}`}
    >
      {/* Room Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: `${headerColor}25`, borderLeft: `5px solid ${headerColor}` }}
      >
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-black tracking-widest uppercase" style={{ color: headerColor }}>
            {headerName}
          </h4>
          <span className="text-[10px] text-gray-400">{groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}</span>
        </div>
        <button
          onClick={onAddItem}
          data-testid={`add-item-${roomKey}-btn`}
          className="px-3 py-1 rounded text-[10px] font-bold border hover:opacity-80"
          style={{ color: headerColor, borderColor: headerColor, background: `${headerColor}15` }}
        >
          + ITEM
        </button>
      </div>

      {/* Items as numbered document list */}
      <ol className="px-4 py-3 space-y-1.5" style={{ listStyle: 'none' }}>
        {groupItems.map(({ item, originalIndex }, localIdx) => (
          <ScopeLine
            key={originalIndex}
            item={item}
            originalIndex={originalIndex}
            number={localIdx + 1}
            headerColor={headerColor}
            rooms={rooms}
            allTrades={allTrades}
            allProducts={allProducts}
            contacts={contacts}
            tradeColors={tradeColors}
            onUpdate={(patch) => onUpdate(originalIndex, patch)}
            onRemove={() => onRemove(originalIndex)}
            onMoveUp={() => onMoveUp(originalIndex)}
            onMoveDown={() => onMoveDown(originalIndex)}
            onSplit={() => onSplit(originalIndex)}
            canSplit={hasMultipleLines(item.description)}
            isFirst={originalIndex === 0}
            isLast={originalIndex === totalItems - 1}
          />
        ))}
      </ol>
    </div>
  );
}

// Single scope line — renders like a numbered document item
function ScopeLine({ item, originalIndex, number, headerColor, rooms, allTrades, allProducts, contacts, tradeColors, onUpdate, onRemove, onMoveUp, onMoveDown, onSplit, canSplit, isFirst, isLast }) {
  const tColor = tradeColors[item.trade_category] || '#6B7280';
  const [showActions, setShowActions] = useState(false);

  const tagProduct = (id) => {
    if (!id) return;
    const current = item.tagged_products || [];
    if (current.includes(id)) return;
    onUpdate({ tagged_products: [...current, id] });
  };
  const untagProduct = (id) => onUpdate({ tagged_products: (item.tagged_products || []).filter(p => p !== id) });
  const tagPerson = (name) => {
    if (!name) return;
    const current = item.tagged_people || [];
    if (current.includes(name)) return;
    onUpdate({ tagged_people: [...current, name] });
  };
  const untagPerson = (name) => onUpdate({ tagged_people: (item.tagged_people || []).filter(p => p !== name) });
  const productLookup = (id) => allProducts.find(p => p.id === id);

  const productTags = item.tagged_products || [];
  const peopleTags = item.tagged_people || [];

  return (
    <li
      className="group relative flex gap-2 items-start px-1 py-1 rounded hover:bg-white/[0.02] transition"
      data-testid={`scope-line-${originalIndex}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Number */}
      <span className="text-sm font-bold pt-1 min-w-[28px] text-right" style={{ color: headerColor }}>{number}.</span>

      {/* Description (compact RTE) */}
      <div className="flex-1 min-w-0">
        <RichTextEditor
          value={item.description}
          onChange={(val) => onUpdate({ description: val })}
          placeholder="Type item description... (formatting available on focus)"
          compact
          minHeight={28}
        />

        {/* Tag chips (always visible if any tags exist) */}
        {(productTags.length > 0 || peopleTags.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-1 ml-2">
            {productTags.map((pid, pi) => {
              const p = productLookup(pid);
              return (
                <span key={pi} className="text-[10px] bg-blue-900/40 text-blue-200 border border-blue-600 px-2 py-0.5 rounded flex items-center gap-1">
                  {p ? `${p.name} (${p.room})` : pid}
                  <span className="cursor-pointer text-red-400 font-bold hover:text-red-300" onClick={() => untagProduct(pid)}>×</span>
                </span>
              );
            })}
            {peopleTags.map((name, pi) => (
              <span key={pi} className="text-[10px] bg-[#D4A574]/20 text-[#D4A574] border border-[#D4A574] px-2 py-0.5 rounded flex items-center gap-1">
                @{name}
                <span className="cursor-pointer text-red-400 font-bold hover:text-red-300" onClick={() => untagPerson(name)}>×</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right-side controls — visible on hover */}
      <div className={`flex items-center gap-1 transition-opacity ${showActions ? 'opacity-100' : 'opacity-30'}`}>
        {/* Trade selector — always color-coded */}
        <select
          value={item.trade_category || ''}
          onChange={e => onUpdate({ trade_category: e.target.value })}
          data-testid={`scope-line-${originalIndex}-trade`}
          className="bg-[#0f1218] border rounded px-1.5 py-0.5 text-[10px] font-bold uppercase max-w-[110px]"
          style={{ color: tColor, borderColor: `${tColor}50` }}
          onClick={e => e.stopPropagation()}
        >
          <option value="">— TRADE —</option>
          {allTrades.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Room selector (small, useful if user wants to move item to another room) */}
        {showActions && (
          <select
            value={item.room_id || ''}
            onChange={e => onUpdate({ room_id: e.target.value })}
            data-testid={`scope-line-${originalIndex}-room`}
            title="Move to room"
            className="bg-[#0f1218] border border-[#2a3040] rounded px-1.5 py-0.5 text-[10px] text-gray-400 max-w-[100px]"
            onClick={e => e.stopPropagation()}
          >
            <option value="">— Room —</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}

        {/* Tag product */}
        <select
          onChange={e => { tagProduct(e.target.value); e.target.value = ''; }}
          data-testid={`scope-line-${originalIndex}-tag-product`}
          title="Tag product"
          className="bg-[#0f1218] border border-blue-700 rounded px-1.5 py-0.5 text-[10px] text-blue-300 max-w-[28px] cursor-pointer"
          onClick={e => e.stopPropagation()}
        >
          <option value="">🏷</option>
          {allProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.room})</option>)}
        </select>

        {/* Tag person */}
        <select
          onChange={e => { tagPerson(e.target.value); e.target.value = ''; }}
          data-testid={`scope-line-${originalIndex}-tag-person`}
          title="Tag person"
          className="bg-[#0f1218] border border-[#D4A574] rounded px-1.5 py-0.5 text-[10px] text-[#D4A574] max-w-[28px] cursor-pointer"
          onClick={e => e.stopPropagation()}
        >
          <option value="">@</option>
          {contacts.map((c, ci) => <option key={ci} value={c.username || c.name}>{c.username || c.name} ({c.role})</option>)}
        </select>

        {showActions && (
          <>
            <button onClick={onMoveUp} disabled={isFirst} className="text-gray-500 hover:text-[#D4A574] disabled:opacity-20 text-xs px-1" title="Move up">▲</button>
            <button onClick={onMoveDown} disabled={isLast} className="text-gray-500 hover:text-[#D4A574] disabled:opacity-20 text-xs px-1" title="Move down">▼</button>
            {canSplit && (
              <button
                onClick={onSplit}
                title="This entry has multiple lines — click to split into separate items"
                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-600/30 text-orange-300 border border-orange-600/40 hover:bg-orange-600/50"
              >
                ✂ SPLIT
              </button>
            )}
            <button onClick={onRemove} data-testid={`scope-line-${originalIndex}-remove`} className="text-red-400 hover:text-red-200 text-sm px-1" title="Remove">×</button>
          </>
        )}
      </div>
    </li>
  );
}
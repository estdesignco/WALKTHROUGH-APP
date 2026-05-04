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
  const [showNewScope, setShowNewScope] = useState(false);
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [showNewChange, setShowNewChange] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [copied, setCopied] = useState(false);

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

      {/* SCOPE OF WORK */}
      <div className="p-4 rounded-lg bg-[#1a1f2e] border border-[#2a3040]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[#D4A574] font-bold text-sm tracking-wider">SCOPE OF WORK</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowNewScope(true)} className="px-3 py-1 rounded text-xs font-bold bg-[#374151] text-white">+ ADD</button>
            {portal && <button onClick={saveScope} className="px-3 py-1 rounded text-xs font-bold bg-[#D4A574] text-black">SAVE</button>}
          </div>
        </div>
        {scopeEntries.map((s, i) => (
          <div key={i} className="mb-3 p-3 bg-black/30 rounded border-l-4 border-[#D4A574]">
            <select
              value={s.room_id}
              onChange={e => { const n = [...scopeEntries]; n[i].room_id = e.target.value; setScopeEntries(n); }}
              className="bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#D4A574] text-xs mb-2 w-full"
            >
              <option value="">Select Room</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <RichTextEditor
              value={s.description}
              onChange={(val) => { const n = [...scopeEntries]; n[i].description = val; setScopeEntries(n); }}
              placeholder="Describe scope of work for this room..."
            />
            {/* TAG PRODUCTS & PEOPLE */}
            <div className="flex gap-2 mt-2 flex-wrap">
              <select onChange={e => { if (e.target.value) { const n = [...scopeEntries]; n[i].tagged_products = [...(n[i].tagged_products||[]), e.target.value]; setScopeEntries(n); } e.target.value=''; }}
                className="bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-blue-300 text-xs">
                <option value="">Tag product...</option>
                {rooms.flatMap(r => r.categories?.flatMap(c => c.subcategories?.flatMap(sub => sub.items?.map(item => (
                  <option key={item.id} value={item.id}>{item.name} ({r.name})</option>
                )))) || [])}
              </select>
              <select onChange={e => { if (e.target.value) { const n = [...scopeEntries]; n[i].tagged_people = [...(n[i].tagged_people||[]), e.target.value]; setScopeEntries(n); } e.target.value=''; }}
                className="bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#D4A574] text-xs">
                <option value="">Tag person...</option>
                {(portal?.contacts||[]).map((c,ci) => <option key={ci} value={c.username||c.name}>@{c.username||c.name} ({c.role})</option>)}
              </select>
            </div>
            {(s.tagged_products||[]).length > 0 && <div className="flex flex-wrap gap-1 mt-1">{s.tagged_products.map((p,pi) => <span key={pi} className="text-[10px] bg-blue-900/30 text-blue-300 border border-blue-600 px-2 py-0.5 rounded">{p}</span>)}</div>}
            {(s.tagged_people||[]).length > 0 && <div className="flex flex-wrap gap-1 mt-1">{s.tagged_people.map((p,pi) => <span key={pi} className="text-[10px] bg-[#D4A574]/20 text-[#D4A574] border border-[#D4A574] px-2 py-0.5 rounded">@{p}</span>)}</div>}
            <button onClick={() => setScopeEntries(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 text-xs mt-1">Remove</button>
          </div>
        ))}
        {showNewScope && (
          <button onClick={() => { setScopeEntries(prev => [...prev, { room_id: '', description: '' }]); setShowNewScope(false); }}
            className="text-[#D4A574] text-sm font-bold">+ Add scope entry</button>
        )}
      </div>

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
          <div key={i} className="mb-2 flex gap-2 items-center">
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
            <textarea value={co.description} onChange={e => { const n = [...changeOrders]; n[i].description = e.target.value; setChangeOrders(n); }}
              placeholder="Description..." className="w-full bg-[#0f1218] border border-[#2a3040] rounded p-2 text-[#F5F5DC] text-sm" rows={2} />
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

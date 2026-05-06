import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import ScopeDocumentEditor from './ScopeDocumentEditor';
import { invalidateScopeRefs } from './ScopeReferenceBadge';
import FileLightbox from './FileLightbox';
import { getRoomColor, getMutedRoomColor, getMutedRoomHeaderStyle } from '../utils/roomColors';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

export default function BuilderPortalManager({ project, onReload }) {
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState(new Set());
  const [scopeEntries, setScopeEntries] = useState([]);
  const [scopeDocument, setScopeDocument] = useState('');
  const [scopeSaved, setScopeSaved] = useState(true);
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
        setScopeDocument(data.scope_document || '');
        setScopeSaved(true);
        setScheduleEntries(data.schedule || []);
        setChangeOrders(data.change_orders || []);
        // Auto-seed contacts with the firm's team members if empty so they're
        // always available for @-tagging in scope without manual setup.
        let loadedContacts = data.contacts || [];
        const isLegacyPlaceholder =
          loadedContacts.length === 1 &&
          loadedContacts[0].username === 'designer' &&
          (loadedContacts[0].name || '').toLowerCase().includes('established design');
        if (loadedContacts.length === 0 || isLegacyPlaceholder) {
          loadedContacts = [
            {
              name: 'Neil Tankersley',
              role: 'Principal Designer / CEO',
              username: 'neil',
              phone: '678-637-3669',
              email: 'Neil@estdesignco.com',
            },
            {
              name: 'Jala Reid',
              role: 'Established Design Co.',
              username: 'jala',
              phone: '470-272-3304',
              email: 'Jala@estdesignco.com',
            },
            {
              name: 'Averi Daunch',
              role: 'Established Design Co.',
              username: 'averi',
              phone: '706-969-8557',
              email: 'Averi@estdesignco.com',
            },
          ];
          // Persist the seed back so next load doesn't re-seed
          fetch(`${API_URL}/api/builder-portal/${data.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contacts: loadedContacts }),
          });
        }
        setContacts(loadedContacts);
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

  const saveScope = async () => {
    await updatePortal({ scope_document: scopeDocument });
    setScopeSaved(true);
    invalidateScopeRefs();
  };
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
                background: selectedRooms.has(room.id) ? room.color || getRoomColor(room.name) : '#2a3040',
                color: selectedRooms.has(room.id) ? '#fff' : '#6B7280',
                border: selectedRooms.has(room.id) ? '2px solid #fff' : '2px solid #374151',
              }}
            >
              {selectedRooms.has(room.id) ? '✓ ' : ''}{room.name}
            </button>
          ))}
        </div>
      </div>

      {/* SCOPE OF WORK - DOCUMENT WITH INLINE TAGS */}
      <div className="p-4 rounded-lg bg-[#1a1f2e] border border-[#2a3040]" data-testid="scope-of-work-section">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="text-[#D4A574] font-bold text-sm tracking-wider">SCOPE OF WORK — MASTER DOCUMENT</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Type freely. Insert <span className="text-yellow-400 font-bold">#trade</span>, <span className="text-blue-300 font-bold">🏷 product</span>, and <span className="text-[#D4A574] font-bold">@person</span> tags inline. Lists by Trade and by Room are auto-generated for the builder.</p>
          </div>
          <div className="flex gap-2 items-center">
            {!scopeSaved && <span className="text-[10px] text-orange-400 font-bold">UNSAVED</span>}
            {portal && (
              <button
                onClick={saveScope}
                data-testid="save-scope-btn"
                className="px-4 py-1.5 rounded text-xs font-bold"
                style={{ background: scopeSaved ? '#10B98140' : '#10B981', color: scopeSaved ? '#10B981' : '#fff' }}
              >
                {scopeSaved ? 'SAVED ✓' : 'SAVE SCOPE'}
              </button>
            )}
          </div>
        </div>
        <ScopeDocumentEditor
          value={scopeDocument}
          onChange={(html) => { setScopeDocument(html); setScopeSaved(false); }}
          rooms={rooms}
          contacts={contacts}
          customTrades={customTrades}
          newTradeName={newTradeName}
          setNewTradeName={setNewTradeName}
          onAddCustomTrade={(t) => {
            const T = t.toUpperCase();
            if (!customTrades.includes(T) && !DEFAULT_TRADES.includes(T)) {
              const updated = [...customTrades, T];
              setCustomTrades(updated);
              if (portal) {
                fetch(`${API_URL}/api/builder-portal/${portal.id}`, {
                  method: 'PUT', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ custom_trades: updated }),
                });
              }
            }
          }}
          onRemoveCustomTrade={(t) => {
            const updated = customTrades.filter(x => x !== t);
            setCustomTrades(updated);
            if (portal) {
              fetch(`${API_URL}/api/builder-portal/${portal.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ custom_trades: updated }),
              });
            }
          }}
        />
      </div>

      {/* PHOTO UPLOADS — Admin can upload general files & per-room photos */}
      <PhotoUploadsSection portal={portal} rooms={rooms} apiUrl={API_URL} onReload={loadPortal} />

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
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="text-[#D4A574] font-bold text-sm tracking-wider">PROJECT CONTACTS</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">These names show up in the @ picker when tagging people in scope. The first contact is your firm — edit it to your liking.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setContacts(prev => [...prev, { name: '', role: '', username: '', phone: '', email: '' }])}
              data-testid="add-contact-btn"
              className="px-3 py-1 rounded text-xs font-bold bg-[#10B981] text-white hover:bg-[#059669]"
            >
              + ADD CONTACT
            </button>
            {portal && <button onClick={saveContacts} data-testid="save-contacts-btn" className="px-3 py-1 rounded text-xs font-bold bg-[#D4A574] text-black">SAVE</button>}
          </div>
        </div>
        {contacts.length === 0 && (
          <p className="text-xs text-gray-500 italic py-3">No contacts yet. Click "+ ADD CONTACT" to add one.</p>
        )}
        {contacts.map((c, i) => (
          <div key={i} className="mb-2 p-2 bg-black/20 rounded flex gap-2 items-center flex-wrap" data-testid={`contact-row-${i}`}>
            <span className="text-[10px] text-gray-500 font-bold min-w-[20px]">{i + 1}.</span>
            <input value={c.name || ''} onChange={e => { const n = [...contacts]; n[i].name = e.target.value; setContacts(n); }}
              placeholder="Full name" className="flex-1 min-w-[120px] bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#F5F5DC] text-sm" />
            <input value={c.role || ''} onChange={e => { const n = [...contacts]; n[i].role = e.target.value; setContacts(n); }}
              placeholder="Role" className="w-[130px] bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#F5F5DC] text-sm" />
            <div className="flex items-center bg-[#0f1218] border border-[#D4A574] rounded">
              <span className="text-[#D4A574] text-sm pl-2 font-bold">@</span>
              <input value={c.username || ''} onChange={e => { const n = [...contacts]; n[i].username = e.target.value.replace(/\s+/g, ''); setContacts(n); }}
                placeholder="username" title="Used when @-tagging in scope. Auto-generated from name if blank." className="w-[110px] bg-transparent border-none rounded px-1 py-1 text-[#D4A574] text-sm font-bold focus:outline-none" />
            </div>
            <input value={c.phone || ''} onChange={e => { const n = [...contacts]; n[i].phone = e.target.value; setContacts(n); }}
              placeholder="Phone" className="w-[120px] bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#F5F5DC] text-sm" />
            <input value={c.email || ''} onChange={e => { const n = [...contacts]; n[i].email = e.target.value; setContacts(n); }}
              placeholder="Email" className="w-[170px] bg-[#0f1218] border border-[#2a3040] rounded px-2 py-1 text-[#F5F5DC] text-sm" />
            <button
              onClick={() => {
                if (window.confirm(`Delete contact "${c.name || 'Unnamed'}"?`)) {
                  setContacts(prev => prev.filter((_, idx) => idx !== i));
                }
              }}
              data-testid={`delete-contact-${i}`}
              title="Delete contact"
              className="px-2 py-1 rounded text-xs font-bold bg-red-900/30 text-red-400 border border-red-900/40 hover:bg-red-900/60"
            >
              × DELETE
            </button>
          </div>
        ))}
        {contacts.length > 0 && (
          <div className="flex justify-center mt-2">
            <button
              onClick={() => setContacts(prev => [...prev, { name: '', role: '', username: '', phone: '', email: '' }])}
              data-testid="add-contact-bottom-btn"
              className="px-4 py-1.5 rounded text-xs font-bold bg-[#10B981]/20 text-[#10B981] border border-dashed border-[#10B981] hover:bg-[#10B981] hover:text-white"
            >
              + ADD ANOTHER CONTACT
            </button>
          </div>
        )}
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
// PHOTO UPLOADS SECTION (Admin)
// General Files (project-wide) + Per-Room Photos
// Reuses existing builder-portal endpoints so files appear in builder view too.
// ============================================================
function PhotoUploadsSection({ portal, rooms, apiUrl, onReload }) {
  const [files, setFiles] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { files: [...], index: 0 }

  useEffect(() => {
    if (!portal) return;
    const fileComments = (portal.comments || []).filter(c => c.section === 'general_file');
    const all = [];
    fileComments.forEach(c => { try { const parsed = JSON.parse(c.text); if (Array.isArray(parsed)) all.push(...parsed); } catch {} });
    setFiles(all);
    fetch(`${apiUrl}/api/photos/project/${portal.project_id}`)
      .then(r => r.ok ? r.json() : { photos: [] })
      .then(d => setPhotos(Array.isArray(d) ? d : (d?.photos || [])))
      .catch(() => setPhotos([]));
  }, [portal, apiUrl]);

  if (!portal) {
    return (
      <div className="p-4 rounded-lg bg-[#1a1f2e] border border-[#2a3040]">
        <h3 className="text-[#D4A574] font-bold text-sm tracking-wider">PHOTOS &amp; FILES</h3>
        <p className="text-xs text-gray-500 italic mt-2">Save the builder portal first to enable photo uploads.</p>
      </div>
    );
  }

  const author = 'Designer (Admin)';

  const uploadGeneralFiles = async (inputFiles) => {
    if (!inputFiles || inputFiles.length === 0) return;
    setUploading(true);
    try {
      const newAll = [...files];
      for (const file of inputFiles) {
        const reader = new FileReader();
        await new Promise(resolve => {
          reader.onload = () => {
            newAll.push({ name: file.name, type: file.type, data: reader.result, uploaded_at: new Date().toISOString(), uploaded_by: author });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
      await fetch(`${apiUrl}/api/builder/${portal.access_code}/comment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'general_file', author, text: JSON.stringify(newAll) }),
      });
      setFiles(newAll);
      onReload && onReload();
    } finally {
      setUploading(false);
    }
  };

  const uploadRoomPhoto = async (roomId, inputFiles) => {
    if (!inputFiles || inputFiles.length === 0) return;
    setUploading(true);
    try {
      for (const file of inputFiles) {
        const reader = new FileReader();
        await new Promise(resolve => {
          reader.onload = async () => {
            await fetch(`${apiUrl}/api/photos/upload`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_id: portal.project_id,
                room_id: roomId,
                file_name: file.name,
                photo_data: reader.result,
                metadata: { source: 'admin', uploaded_by: author },
              }),
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
      const fresh = await fetch(`${apiUrl}/api/photos/project/${portal.project_id}`)
        .then(r => r.ok ? r.json() : { photos: [] });
      setPhotos(Array.isArray(fresh) ? fresh : (fresh?.photos || []));
      onReload && onReload();
    } finally {
      setUploading(false);
    }
  };

  const photosByRoom = {};
  photos.forEach(p => {
    const k = p.room_id || '__no_room__';
    if (!photosByRoom[k]) photosByRoom[k] = [];
    photosByRoom[k].push(p);
  });

  return (
    <div className="p-4 rounded-lg bg-[#1a1f2e] border border-[#2a3040]" data-testid="admin-photo-uploads">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-[#D4A574] font-bold text-sm tracking-wider">PHOTOS &amp; FILES</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">Anything you upload here is visible to the builder in their portal.</p>
        </div>
      </div>

      {/* GENERAL UPLOADS */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-[11px] font-bold text-gray-400 tracking-widest">GENERAL UPLOADS</h4>
          <label className="px-3 py-1.5 rounded text-xs font-bold bg-[#10B981] text-white cursor-pointer hover:bg-[#059669]" data-testid="admin-general-upload-btn">
            📁 {uploading ? 'UPLOADING...' : '+ UPLOAD FILES'}
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xlsx,.txt"
              onChange={e => uploadGeneralFiles(Array.from(e.target.files))}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        {files.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-2">No general files uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {files.map((f, i) => (
              <div
                key={i}
                onClick={() => setLightbox({ files, index: i })}
                className="bg-black/30 rounded overflow-hidden border border-[#2a3040] cursor-pointer hover:border-[#D4A574] transition"
                title="Click to open"
                data-testid={`general-file-${i}`}
              >
                {f.type && f.type.startsWith('image') ? (
                  <img src={f.data} alt={f.name} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: 80, background: '#0f1218', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4A574', fontSize: 28 }}>📄</div>
                )}
                <div className="px-1.5 py-1">
                  <p className="text-[10px] text-[#F5F5DC] truncate">{f.name}</p>
                  <p className="text-[9px] text-gray-500">{f.uploaded_by}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PER-ROOM PHOTOS */}
      <div>
        <h4 className="text-[11px] font-bold text-gray-400 tracking-widest mb-2">PER-ROOM PHOTOS</h4>
        {rooms.length === 0 && <p className="text-xs text-gray-500 italic">No rooms yet. Add rooms in the Walkthrough first.</p>}
        {(() => {
          // Sort identically to FFE so order is consistent across pages
          const FLOOR_ORDER = ['Basement', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor'];
          const sortedRooms = [...rooms].sort((a, b) => {
            const fa = FLOOR_ORDER.indexOf(a.floor || '1st Floor');
            const fb = FLOOR_ORDER.indexOf(b.floor || '1st Floor');
            if (fa !== fb) return fa - fb;
            const oa = a.order_index ?? 999;
            const ob = b.order_index ?? 999;
            if (oa !== ob) return oa - ob;
            return (a.name || '').localeCompare(b.name || '');
          });
          return sortedRooms.map(room => {
          const roomPhotos = photosByRoom[room.id] || [];
          const isOpen = activeRoomId === room.id;
          // Use SAME color chain as admin Checklist (room.color → name-hash fallback)
          // so the Builder Portal Manager renders identical hues to the Checklist.
          const roomColor = room.color || getRoomColor(room.name);
          return (
            <div key={room.id} className="mb-2 overflow-hidden" style={{ border: '1px solid #D4A574' }} data-testid={`admin-room-photos-${room.id}`}>
              {/* Header styled like Checklist/FFE — muted gradient, cream text, gold border */}
              <div
                onClick={() => setActiveRoomId(isOpen ? null : room.id)}
                className="flex justify-between items-center px-3 py-1.5 cursor-pointer hover:opacity-90"
                style={getMutedRoomHeaderStyle(roomColor)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#D4C5A9]" style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>{room.name.toUpperCase()}</span>
                  <span className="text-[10px] text-[#D4C5A9] opacity-70">({roomPhotos.length} photos)</span>
                </div>
                <div className="flex gap-2 items-center">
                  <label
                    onClick={e => e.stopPropagation()}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-[#D4A574] text-black cursor-pointer hover:bg-[#E5B585]"
                    data-testid={`admin-room-upload-${room.id}`}
                  >
                    + UPLOAD
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={e => uploadRoomPhoto(room.id, Array.from(e.target.files))}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span className="text-[#D4C5A9] text-xs">{isOpen ? '▾' : '▸'}</span>
                </div>
              </div>
              {isOpen && (
                <div className="p-2 bg-black/30">
                  {roomPhotos.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-2">No photos for this room yet.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                      {roomPhotos.map((p, pi) => (
                        <div
                          key={pi}
                          onClick={() => setLightbox({ files: roomPhotos.map(rp => ({ data: rp.photo_data || rp.url, name: rp.file_name || 'photo', type: 'image/*' })), index: pi })}
                          className="bg-black/30 rounded overflow-hidden cursor-pointer hover:opacity-80 transition"
                          title="Click to open"
                        >
                          <img src={p.photo_data || p.url} alt={p.file_name || 'photo'} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                          <p className="text-[9px] text-gray-400 truncate px-1 py-0.5">{p.file_name || 'photo'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
          });
        })()}
      </div>
      {lightbox && (
        <FileLightbox
          files={lightbox.files}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
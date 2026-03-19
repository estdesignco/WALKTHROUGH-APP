import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ruler, Plus, Trash2, MousePointer, X, Pencil, GripVertical, Check } from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

const SCHEDULE_TYPES = [
  { value: 'tile', label: 'Tile' },
  { value: 'paint_wallpaper', label: 'Paint / Wallpaper' },
  { value: 'wood_mixed', label: 'Wood / Mixed' },
];

const LINE_COLORS = ['#FF4444', '#44AAFF', '#44FF44', '#FFAA44', '#FF44FF', '#FFFFFF'];

// Helper: get best image from item
const getItemImage = (item) =>
  item.image_url || item.finish_image || item.image || (item.photos?.length ? item.photos[0] : '') || '';

// ─── Measurement Canvas ───────────────────────────────────────────────
const MeasurementCanvas = ({ lines = [], onLinesChange, readOnly = false }) => {
  const svgRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentMouse, setCurrentMouse] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [inputVal, setInputVal] = useState('');
  const [activeColor, setActiveColor] = useState('#FF4444');
  const [toolMode, setToolMode] = useState('select');

  const getSvgPoint = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 };
  };

  const handleMouseDown = (e) => { if (readOnly || toolMode !== 'draw') return; e.preventDefault(); const pt = getSvgPoint(e); setDrawing(true); setDrawStart(pt); setCurrentMouse(pt); };
  const handleMouseMove = (e) => { if (drawing) setCurrentMouse(getSvgPoint(e)); };
  const handleMouseUp = (e) => {
    if (!drawing || !drawStart) return;
    const end = getSvgPoint(e);
    if (Math.abs(end.x - drawStart.x) < 1 && Math.abs(end.y - drawStart.y) < 1) { setDrawing(false); setDrawStart(null); return; }
    const newLine = { id: crypto.randomUUID(), start_x: drawStart.x, start_y: drawStart.y, end_x: end.x, end_y: end.y, measurement: '', color: activeColor, thickness: 2 };
    onLinesChange([...lines, newLine]);
    setDrawing(false); setDrawStart(null); setEditingId(newLine.id); setInputVal('');
  };

  const saveMeasurement = (id) => { onLinesChange(lines.map(l => l.id === id ? { ...l, measurement: inputVal } : l)); setEditingId(null); };
  const deleteLine = (id) => { onLinesChange(lines.filter(l => l.id !== id)); setSelectedLine(null); };

  return (
    <div className="relative" data-testid="measurement-canvas">
      {!readOnly && (
        <div className="flex items-center gap-2 mb-1 px-2 py-1 rounded border border-[#B49B7E]/15" style={{ background: 'rgba(20,20,30,0.7)' }}>
          <button onClick={() => setToolMode('select')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${toolMode === 'select' ? 'bg-blue-600 text-white' : 'text-[#D4C5A9]/50'}`}><MousePointer size={10} /> Select</button>
          <button onClick={() => setToolMode('draw')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${toolMode === 'draw' ? 'bg-orange-600 text-white' : 'text-[#D4C5A9]/50'}`} data-testid="tool-draw"><Ruler size={10} /> Draw</button>
          <div className="flex gap-0.5 ml-2">{LINE_COLORS.map(c => <button key={c} onClick={() => setActiveColor(c)} className={`w-4 h-4 rounded-full border ${activeColor === c ? 'border-white scale-125' : 'border-transparent'}`} style={{ background: c }} />)}</div>
          {selectedLine && !editingId && <>
            <button onClick={() => { setEditingId(selectedLine); setInputVal(lines.find(l => l.id === selectedLine)?.measurement || ''); }} className="ml-auto px-2 py-0.5 rounded text-[10px] text-white bg-blue-600"><Pencil size={8} className="inline mr-1" />Edit</button>
            <button onClick={() => deleteLine(selectedLine)} className="px-2 py-0.5 rounded text-[10px] text-white bg-red-600"><Trash2 size={8} className="inline mr-1" />Del</button>
          </>}
        </div>
      )}
      <svg ref={svgRef} viewBox="0 0 100 56" className="w-full border border-[#B49B7E]/15 rounded" style={{ background: 'rgba(10,10,18,0.5)', cursor: toolMode === 'draw' ? 'crosshair' : 'default' }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { if (drawing) { setDrawing(false); setDrawStart(null); } }}>
        <defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(180,155,126,0.06)" strokeWidth="0.1" /></pattern></defs>
        <rect width="100" height="56" fill="url(#grid)" />
        {lines.map(line => {
          const mx = (line.start_x + line.end_x) / 2, my = (line.start_y + line.end_y) / 2;
          const angle = Math.atan2(line.end_y - line.start_y, line.end_x - line.start_x) * 180 / Math.PI;
          const rad = angle * Math.PI / 180;
          const dispAngle = angle > 90 || angle < -90 ? angle + 180 : angle;
          return (
            <g key={line.id}>
              <line x1={line.start_x} y1={line.start_y} x2={line.end_x} y2={line.end_y} stroke={line.color} strokeWidth={0.5} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); if (toolMode === 'select') setSelectedLine(selectedLine === line.id ? null : line.id); }} />
              <line x1={line.start_x - 0.8 * Math.sin(rad)} y1={line.start_y + 0.8 * Math.cos(rad)} x2={line.start_x + 0.8 * Math.sin(rad)} y2={line.start_y - 0.8 * Math.cos(rad)} stroke={line.color} strokeWidth={0.2} />
              <line x1={line.end_x - 0.8 * Math.sin(rad)} y1={line.end_y + 0.8 * Math.cos(rad)} x2={line.end_x + 0.8 * Math.sin(rad)} y2={line.end_y - 0.8 * Math.cos(rad)} stroke={line.color} strokeWidth={0.2} />
              {line.measurement && <g transform={`translate(${mx + 1.2 * Math.sin(rad)}, ${my - 1.2 * Math.cos(rad)}) rotate(${dispAngle})`}><rect x={-line.measurement.length * 0.7} y="-1.5" width={line.measurement.length * 1.4} height="2.8" rx="0.4" fill="rgba(0,0,0,0.85)" stroke={line.color} strokeWidth="0.12" /><text textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="1.6" fontFamily="monospace" fontWeight="bold">{line.measurement}</text></g>}
              {selectedLine === line.id && <><circle cx={line.start_x} cy={line.start_y} r="0.8" fill={line.color} stroke="white" strokeWidth="0.2" /><circle cx={line.end_x} cy={line.end_y} r="0.8" fill={line.color} stroke="white" strokeWidth="0.2" /></>}
            </g>
          );
        })}
        {drawing && drawStart && currentMouse && <line x1={drawStart.x} y1={drawStart.y} x2={currentMouse.x} y2={currentMouse.y} stroke={activeColor} strokeWidth={0.4} strokeDasharray="1 0.5" opacity={0.7} />}
      </svg>
      {editingId && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 items-center p-2 rounded-lg border border-[#B49B7E]/40 shadow-xl z-10" style={{ background: 'rgba(0,0,0,0.95)' }}>
          <input autoFocus data-testid="measurement-input" placeholder='e.g. 24" or 6 ft' value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveMeasurement(editingId); }} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs w-32 focus:outline-none" />
          <button onClick={() => saveMeasurement(editingId)} className="px-2 py-1 rounded text-[10px] font-bold text-white bg-green-600">Save</button>
          <button onClick={() => setEditingId(null)} className="px-2 py-1 rounded text-[10px] text-[#D4C5A9]/60">Skip</button>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────
const RoomFinishSchedule = ({ projectId, roomId, roomName, onClose }) => {
  const [schedules, setSchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('tile');
  const [saving, setSaving] = useState(false);
  const [roomItems, setRoomItems] = useState([]);
  const [assigningSurface, setAssigningSurface] = useState(null); // surface ID being assigned to
  const [showMeasurements, setShowMeasurements] = useState(false);
  const saveTimeoutRef = useRef(null);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/rooms/${roomId}/finish-schedules`);
      const data = await res.json();
      setSchedules(data);
      if (data.length > 0 && !activeSchedule) setActiveSchedule(data[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [projectId, roomId, activeSchedule]);

  const fetchRoomItems = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}`);
      const project = await res.json();
      const room = (project.rooms || []).find(r => r.id === roomId);
      if (!room) return;
      const items = [];
      (room.categories || []).forEach(cat => {
        (cat.subcategories || []).forEach(sub => {
          (sub.items || []).forEach(item => {
            items.push({ ...item, categoryName: cat.name, subcategoryName: sub.name, _img: getItemImage(item) });
          });
        });
      });
      setRoomItems(items);
    } catch (err) { console.error(err); }
  }, [projectId, roomId]);

  useEffect(() => { fetchSchedules(); fetchRoomItems(); }, [fetchSchedules, fetchRoomItems]);

  const saveSchedule = useCallback(async (schedule) => {
    if (!schedule) return;
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/finish-schedules/${schedule.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surfaces: schedule.surfaces, measurement_lines: schedule.measurement_lines || [] })
      });
      const updated = await res.json();
      setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
      return updated;
    } catch (err) { console.error(err); }
  }, [projectId]);

  const debouncedSave = useCallback((schedule) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveSchedule(schedule), 800);
  }, [saveSchedule]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/rooms/${roomId}/finish-schedules`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_type: newType, name: newName.trim() })
      });
      const schedule = await res.json();
      setSchedules(prev => [...prev, schedule]);
      setActiveSchedule(schedule);
      setShowCreate(false); setNewName('');
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await fetch(`${API_URL}/api/projects/${projectId}/finish-schedules/${id}`, { method: 'DELETE' });
      setSchedules(prev => prev.filter(s => s.id !== id));
      if (activeSchedule?.id === id) setActiveSchedule(null);
    } catch (err) { console.error(err); }
  };

  // Add item to surface directly
  const addItemToSurface = (surfaceId, item) => {
    if (!activeSchedule) return;
    const material = {
      id: crypto.randomUUID(),
      item_id: item.id,
      name: item.name || '',
      vendor: item.vendor || '',
      sku: item.sku || '',
      size: item.size || '',
      color: item.finish_color || item.color || '',
      image: item._img || '',
      link: item.link || '',
      position_label: '',
    };
    const updatedSurfaces = activeSchedule.surfaces.map(s =>
      s.id === surfaceId ? { ...s, materials: [...s.materials, material] } : s
    );
    const updated = { ...activeSchedule, surfaces: updatedSurfaces };
    setActiveSchedule(updated);
    debouncedSave(updated);
    setAssigningSurface(null);
  };

  const removeMaterial = (surfaceId, materialId) => {
    if (!activeSchedule) return;
    const updatedSurfaces = activeSchedule.surfaces.map(s =>
      s.id === surfaceId ? { ...s, materials: s.materials.filter(m => m.id !== materialId) } : s
    );
    const updated = { ...activeSchedule, surfaces: updatedSurfaces };
    setActiveSchedule(updated);
    debouncedSave(updated);
  };

  const addSurface = () => {
    if (!activeSchedule) return;
    const name = prompt('Surface name (e.g., "Accent Niche", "Window Sill"):');
    if (!name) return;
    const updatedSurfaces = [...activeSchedule.surfaces, { id: crypto.randomUUID(), name, surface_type: 'wall', materials: [], measurement_lines: [] }];
    const updated = { ...activeSchedule, surfaces: updatedSurfaces };
    setActiveSchedule(updated);
    debouncedSave(updated);
  };

  const removeSurface = (surfaceId) => {
    if (!activeSchedule || !window.confirm('Delete this surface?')) return;
    const updatedSurfaces = activeSchedule.surfaces.filter(s => s.id !== surfaceId);
    const updated = { ...activeSchedule, surfaces: updatedSurfaces };
    setActiveSchedule(updated);
    debouncedSave(updated);
  };

  const handleLinesChange = (newLines) => {
    const updated = { ...activeSchedule, measurement_lines: newLines };
    setActiveSchedule(updated);
    debouncedSave(updated);
  };

  if (loading) return <div className="text-center py-8 text-[#D4C5A9]/60">Loading...</div>;

  // Items that have images get shown first
  const itemsWithImages = roomItems.filter(i => i._img);
  const itemsWithoutImages = roomItems.filter(i => !i._img);

  return (
    <div data-testid="room-finish-schedule" className="rounded-xl border border-[#B49B7E]/20 p-4" style={{ background: 'rgba(0,0,0,0.9)' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-base font-bold text-white">{roomName}</h3>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 rounded text-xs font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #D4A574 0%, #8B7355 100%)' }} data-testid="create-schedule-btn"><Plus size={12} className="inline mr-1" />New Schedule</button>
          {onClose && <button onClick={onClose} className="px-2 py-1.5 rounded text-xs text-[#D4C5A9]/50 border border-[#B49B7E]/20"><X size={12} /></button>}
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mb-3 p-3 rounded-lg border border-[#B49B7E]/20" style={{ background: 'rgba(30,30,40,0.9)' }}>
          <input type="text" data-testid="schedule-name-input" placeholder="Name (e.g., Primary Shower)" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }} className="w-full px-3 py-2 mb-2 rounded border border-[#B49B7E] bg-black/50 text-white text-sm focus:outline-none focus:border-[#D4A574]" />
          <div className="flex gap-2 mb-2">
            {SCHEDULE_TYPES.map(t => <button key={t.value} onClick={() => setNewType(t.value)} className={`px-3 py-1.5 rounded text-xs font-bold ${newType === t.value ? 'text-white' : 'text-[#D4C5A9]/40 border border-[#B49B7E]/15'}`} style={newType === t.value ? { background: 'linear-gradient(135deg, #D4A574 0%, #8B7355 100%)' } : {}}>{t.label}</button>)}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving || !newName.trim()} className="px-4 py-1.5 rounded text-xs font-bold text-white bg-green-600 disabled:opacity-40">{saving ? 'Creating...' : 'Create'}</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded text-xs text-[#D4C5A9]/50 border border-[#B49B7E]/20">Cancel</button>
          </div>
        </div>
      )}

      {/* Schedule Tabs */}
      {schedules.length > 0 && (
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {schedules.map(s => (
            <button key={s.id} onClick={() => setActiveSchedule(s)} className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-all ${activeSchedule?.id === s.id ? 'text-white' : 'text-[#D4C5A9]/40 border border-[#B49B7E]/15'}`} style={activeSchedule?.id === s.id ? { background: 'linear-gradient(135deg, #D4A574 0%, #8B7355 100%)' } : {}}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {activeSchedule ? (
        <div>
          {/* Action bar */}
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold text-[#D4A574]">{activeSchedule.name}</h4>
            <div className="flex gap-1">
              <button onClick={() => setShowMeasurements(!showMeasurements)} className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 ${showMeasurements ? 'bg-blue-600 text-white' : 'text-[#D4C5A9]/40 border border-[#B49B7E]/15'}`} data-testid="toggle-measurements-btn"><Ruler size={10} />Dimensions</button>
              <button onClick={addSurface} className="px-2 py-1 rounded text-[10px] text-white bg-blue-700" data-testid="add-surface-btn"><Plus size={10} className="inline" /> Surface</button>
              <button onClick={() => handleDelete(activeSchedule.id)} className="px-2 py-1 rounded text-[10px] text-white bg-red-700"><Trash2 size={10} className="inline" /></button>
            </div>
          </div>

          {/* Measurement Canvas */}
          {showMeasurements && (
            <div className="mb-3">
              <MeasurementCanvas lines={activeSchedule.measurement_lines || []} onLinesChange={handleLinesChange} />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* ROOM ITEMS — shown directly with images                    */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="mb-4 p-3 rounded-lg border border-[#D4A574]/20" style={{ background: 'rgba(212,165,116,0.04)' }}>
            <div className="text-xs font-bold text-[#D4A574] mb-2">
              Room Items — click to assign to a surface
              {assigningSurface && <span className="ml-2 text-green-400 animate-pulse">Select an item for: {activeSchedule.surfaces.find(s => s.id === assigningSurface)?.name}</span>}
            </div>
            {itemsWithImages.length === 0 && itemsWithoutImages.length === 0 ? (
              <div className="text-[#B49B7E]/30 text-xs py-4 text-center">No items in this room yet. Add items via the Checklist or FF&E tab first.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-80 overflow-y-auto">
                {/* Items WITH images first */}
                {itemsWithImages.map(item => (
                  <button
                    key={item.id}
                    data-testid={`pick-item-${item.id}`}
                    onClick={() => {
                      if (assigningSurface) {
                        addItemToSurface(assigningSurface, item);
                      } else if (activeSchedule.surfaces.length > 0) {
                        setAssigningSurface(activeSchedule.surfaces[0].id);
                        addItemToSurface(activeSchedule.surfaces[0].id, item);
                      }
                    }}
                    className="rounded-lg border border-[#B49B7E]/20 overflow-hidden hover:border-[#D4A574] hover:scale-105 transition-all text-left group"
                    style={{ background: 'rgba(0,0,0,0.4)' }}
                  >
                    <div className="w-full aspect-square overflow-hidden">
                      <img src={item._img} alt={item.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="p-1">
                      <div className="text-white text-[9px] font-bold truncate leading-tight">{item.name}</div>
                      {item.vendor && <div className="text-[#B49B7E]/50 text-[8px] truncate">{item.vendor}</div>}
                      {item.status && <div className={`text-[7px] font-bold ${item.status === 'APPROVED' ? 'text-green-400' : item.status === 'ORDERED' ? 'text-blue-400' : 'text-[#B49B7E]/30'}`}>{item.status}</div>}
                    </div>
                  </button>
                ))}
                {/* Items WITHOUT images */}
                {itemsWithoutImages.map(item => (
                  <button
                    key={item.id}
                    data-testid={`pick-item-${item.id}`}
                    onClick={() => {
                      if (assigningSurface) {
                        addItemToSurface(assigningSurface, item);
                      } else if (activeSchedule.surfaces.length > 0) {
                        setAssigningSurface(activeSchedule.surfaces[0].id);
                        addItemToSurface(activeSchedule.surfaces[0].id, item);
                      }
                    }}
                    className="rounded-lg border border-[#B49B7E]/10 overflow-hidden hover:border-[#B49B7E]/40 transition-all text-left"
                    style={{ background: 'rgba(0,0,0,0.3)' }}
                  >
                    <div className="w-full aspect-square bg-[#1a1a24] flex items-center justify-center">
                      <span className="text-[#B49B7E]/20 text-[8px]">No img</span>
                    </div>
                    <div className="p-1">
                      <div className="text-[#B49B7E]/60 text-[8px] font-bold truncate leading-tight">{item.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* SURFACES — each with assigned materials shown as images    */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="space-y-2">
            {activeSchedule.surfaces.map(surface => {
              const isAssigning = assigningSurface === surface.id;
              return (
                <div key={surface.id} className={`rounded-lg border overflow-hidden ${isAssigning ? 'border-green-500/50 ring-1 ring-green-500/30' : 'border-[#B49B7E]/15'}`} style={{ background: 'rgba(15,15,25,0.7)' }} data-testid={`surface-${surface.id}`}>
                  {/* Surface header */}
                  <div className="flex justify-between items-center px-3 py-2" style={{ background: 'rgba(180,155,126,0.06)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-xs">{surface.name}</span>
                      <span className="text-[#B49B7E]/30 text-[10px]">({surface.materials.length})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setAssigningSurface(isAssigning ? null : surface.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${isAssigning ? 'bg-green-600 text-white' : 'bg-green-800/50 text-green-300 hover:bg-green-700'}`}
                        data-testid={`assign-to-${surface.id}`}
                      >
                        {isAssigning ? <><Check size={10} /> Selecting...</> : <><Plus size={10} /> Add</>}
                      </button>
                      <button onClick={() => removeSurface(surface.id)} className="px-1 py-1 text-[#B49B7E]/20 hover:text-red-400"><Trash2 size={10} /></button>
                    </div>
                  </div>

                  {/* Assigned materials — shown as image tiles */}
                  <div className="p-2 min-h-[60px]">
                    {surface.materials.length === 0 ? (
                      <div className="text-center py-3 text-[#B49B7E]/20 text-[10px]">
                        {isAssigning ? 'Now click an item above to add it here' : 'Click "+ Add" then select an item from above'}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {surface.materials.map(mat => (
                          <div key={mat.id} className="group relative" data-testid={`tile-swatch-${mat.id}`}>
                            <div className="w-20 h-20 rounded-lg border-2 border-[#B49B7E]/30 overflow-hidden cursor-pointer hover:border-[#D4A574] hover:scale-105 transition-all" onClick={() => { if (mat.link) window.open(mat.link, '_blank'); }}>
                              {mat.image ? (
                                <img src={mat.image} alt={mat.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; e.target.parentElement.style.background = '#333'; }} />
                              ) : (
                                <div className="w-full h-full bg-[#222] flex items-center justify-center"><span className="text-[#B49B7E]/30 text-[8px] text-center px-1">{mat.name?.substring(0, 20)}</span></div>
                              )}
                            </div>
                            <div className="text-[8px] text-[#B49B7E]/50 truncate w-20 text-center mt-0.5">{mat.name}</div>
                            {/* Tooltip */}
                            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 rounded-lg border border-[#B49B7E]/30 text-[10px] shadow-xl" style={{ background: 'rgba(0,0,0,0.95)' }}>
                              {mat.image && <img src={mat.image} alt={mat.name} className="w-full h-24 object-cover rounded mb-1" />}
                              <div className="text-white font-bold">{mat.name}</div>
                              {mat.vendor && <div className="text-[#B49B7E]">{mat.vendor}</div>}
                              {mat.sku && <div className="text-[#B49B7E]">SKU: {mat.sku}</div>}
                              {mat.size && <div className="text-[#B49B7E]">{mat.size}</div>}
                              {mat.color && <div className="text-[#B49B7E]">{mat.color}</div>}
                            </div>
                            {/* Remove */}
                            <button onClick={() => removeMaterial(surface.id, mat.id)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100">x</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-[#D4C5A9]/30 text-sm mb-1">No finish schedules yet</div>
          <div className="text-[#B49B7E]/30 text-xs">Create one to start assigning tiles, paint, and materials to surfaces</div>
        </div>
      ) : null}
    </div>
  );
};

export default RoomFinishSchedule;

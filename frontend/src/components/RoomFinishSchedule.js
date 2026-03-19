import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ruler, Plus, Trash2, Move, MousePointer, Save, X, ChevronDown, ChevronUp, Pencil, Eye } from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

const SURFACE_TYPES = {
  wall: { icon: '|', color: '#6B8EAE' },
  floor: { icon: '_', color: '#8B7355' },
  ceiling: { icon: '^', color: '#9B8EC4' },
  niche: { icon: '[]', color: '#6BAE8E' },
  trim: { icon: '~', color: '#AE6B8E' },
};

const SCHEDULE_TYPES = [
  { value: 'tile', label: 'Tile Schedule' },
  { value: 'paint_wallpaper', label: 'Paint / Wallpaper' },
  { value: 'wood_mixed', label: 'Wood / Mixed Materials' },
];

const LINE_COLORS = ['#FF4444', '#44AAFF', '#44FF44', '#FFAA44', '#FF44FF', '#FFFFFF'];

// ─── Measurement Line Drawing Component ───────────────────────────────
const MeasurementCanvas = ({ lines = [], onLinesChange, readOnly = false }) => {
  const svgRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentMouse, setCurrentMouse] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [measurementInput, setMeasurementInput] = useState('');
  const [activeColor, setActiveColor] = useState('#FF4444');
  const [activeThickness, setActiveThickness] = useState(2);
  const [toolMode, setToolMode] = useState('select'); // 'select' | 'draw'

  const getSvgPoint = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const handleMouseDown = (e) => {
    if (readOnly || toolMode !== 'draw') return;
    e.preventDefault();
    const pt = getSvgPoint(e);
    setDrawing(true);
    setDrawStart(pt);
    setCurrentMouse(pt);
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    setCurrentMouse(getSvgPoint(e));
  };

  const handleMouseUp = (e) => {
    if (!drawing || !drawStart) return;
    const end = getSvgPoint(e);
    const dx = Math.abs(end.x - drawStart.x);
    const dy = Math.abs(end.y - drawStart.y);
    if (dx < 1 && dy < 1) {
      setDrawing(false);
      setDrawStart(null);
      return;
    }
    const newLine = {
      id: crypto.randomUUID(),
      start_x: drawStart.x,
      start_y: drawStart.y,
      end_x: end.x,
      end_y: end.y,
      measurement: '',
      label: '',
      color: activeColor,
      thickness: activeThickness,
    };
    const updated = [...lines, newLine];
    onLinesChange(updated);
    setDrawing(false);
    setDrawStart(null);
    setEditingMeasurement(newLine.id);
    setMeasurementInput('');
  };

  const handleSaveMeasurement = (lineId) => {
    const updated = lines.map(l =>
      l.id === lineId ? { ...l, measurement: measurementInput } : l
    );
    onLinesChange(updated);
    setEditingMeasurement(null);
    setMeasurementInput('');
  };

  const handleDeleteLine = (lineId) => {
    onLinesChange(lines.filter(l => l.id !== lineId));
    if (selectedLine === lineId) setSelectedLine(null);
  };

  const getMidpoint = (line) => ({
    x: (line.start_x + line.end_x) / 2,
    y: (line.start_y + line.end_y) / 2,
  });

  const getAngle = (line) => {
    const dx = line.end_x - line.start_x;
    const dy = line.end_y - line.start_y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getLength = (line) => {
    const dx = line.end_x - line.start_x;
    const dy = line.end_y - line.start_y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  return (
    <div className="relative" data-testid="measurement-canvas">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-2 mb-2 p-2 rounded-lg border border-[#B49B7E]/20" style={{ background: 'rgba(20,20,30,0.9)' }}>
          <button
            data-testid="tool-select"
            onClick={() => setToolMode('select')}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-all ${toolMode === 'select' ? 'bg-blue-600 text-white' : 'text-[#D4C5A9]/60 border border-[#B49B7E]/20 hover:border-[#B49B7E]/50'}`}
          >
            <MousePointer size={12} /> Select
          </button>
          <button
            data-testid="tool-draw"
            onClick={() => setToolMode('draw')}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-all ${toolMode === 'draw' ? 'bg-orange-600 text-white' : 'text-[#D4C5A9]/60 border border-[#B49B7E]/20 hover:border-[#B49B7E]/50'}`}
          >
            <Ruler size={12} /> Draw Line
          </button>
          <div className="h-4 w-px bg-[#B49B7E]/20 mx-1" />
          <div className="flex gap-1">
            {LINE_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setActiveColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${activeColor === c ? 'border-white scale-125' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="h-4 w-px bg-[#B49B7E]/20 mx-1" />
          <select
            value={activeThickness}
            onChange={e => setActiveThickness(Number(e.target.value))}
            className="px-2 py-1 rounded text-xs bg-black/50 text-white border border-[#B49B7E]/30"
          >
            <option value={1}>Thin</option>
            <option value={2}>Normal</option>
            <option value={3}>Thick</option>
            <option value={4}>Bold</option>
          </select>
          <span className="text-[10px] text-[#B49B7E]/40 ml-auto">
            {toolMode === 'draw' ? 'Click + drag to draw a measurement line' : 'Click a line to edit'}
          </span>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="w-full border border-[#B49B7E]/20 rounded-lg"
        style={{
          aspectRatio: '16/9',
          background: 'rgba(10,10,18,0.6)',
          cursor: toolMode === 'draw' ? 'crosshair' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { if (drawing) { setDrawing(false); setDrawStart(null); } }}
        data-testid="measurement-svg"
      >
        {/* Grid lines for reference */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(180,155,126,0.08)" strokeWidth="0.15" />
          </pattern>
          <marker id="arrowStart" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
            <path d="M6,0 L0,2 L6,4" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </marker>
          <marker id="arrowEnd" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <path d="M0,0 L6,2 L0,4" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </marker>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Existing lines */}
        {lines.map(line => {
          const mid = getMidpoint(line);
          const angle = getAngle(line);
          const len = getLength(line);
          const isSelected = selectedLine === line.id;
          const perpOffset = -1.5;
          const rad = (angle * Math.PI) / 180;
          const labelX = mid.x + perpOffset * Math.sin(rad);
          const labelY = mid.y - perpOffset * Math.cos(rad);
          const displayAngle = angle > 90 || angle < -90 ? angle + 180 : angle;

          return (
            <g key={line.id} style={{ color: line.color }}>
              {/* Dimension line with end ticks */}
              <line
                x1={line.start_x} y1={line.start_y}
                x2={line.end_x} y2={line.end_y}
                stroke={line.color}
                strokeWidth={line.thickness * 0.3}
                strokeDasharray={isSelected ? '1 0.5' : 'none'}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (toolMode === 'select') setSelectedLine(isSelected ? null : line.id);
                }}
              />
              {/* End tick marks */}
              {len > 3 && (
                <>
                  <line
                    x1={line.start_x - 1 * Math.sin(rad)} y1={line.start_y + 1 * Math.cos(rad)}
                    x2={line.start_x + 1 * Math.sin(rad)} y2={line.start_y - 1 * Math.cos(rad)}
                    stroke={line.color} strokeWidth={line.thickness * 0.2}
                  />
                  <line
                    x1={line.end_x - 1 * Math.sin(rad)} y1={line.end_y + 1 * Math.cos(rad)}
                    x2={line.end_x + 1 * Math.sin(rad)} y2={line.end_y - 1 * Math.cos(rad)}
                    stroke={line.color} strokeWidth={line.thickness * 0.2}
                  />
                </>
              )}
              {/* Measurement text */}
              {line.measurement && (
                <g transform={`translate(${labelX}, ${labelY}) rotate(${displayAngle})`}>
                  <rect x={-line.measurement.length * 0.8} y="-1.8" width={line.measurement.length * 1.6} height="3.2" rx="0.5" fill="rgba(0,0,0,0.85)" stroke={line.color} strokeWidth="0.15" />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="1.8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {line.measurement}
                  </text>
                </g>
              )}
              {/* Selection dots */}
              {isSelected && (
                <>
                  <circle cx={line.start_x} cy={line.start_y} r="1" fill={line.color} stroke="white" strokeWidth="0.3" />
                  <circle cx={line.end_x} cy={line.end_y} r="1" fill={line.color} stroke="white" strokeWidth="0.3" />
                </>
              )}
            </g>
          );
        })}

        {/* Currently drawing line */}
        {drawing && drawStart && currentMouse && (
          <line
            x1={drawStart.x} y1={drawStart.y}
            x2={currentMouse.x} y2={currentMouse.y}
            stroke={activeColor}
            strokeWidth={activeThickness * 0.3}
            strokeDasharray="1 0.5"
            opacity={0.7}
          />
        )}
      </svg>

      {/* Editing measurement input (overlay) */}
      {editingMeasurement && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 items-center p-3 rounded-lg border border-[#B49B7E]/40 shadow-xl z-10" style={{ background: 'rgba(0,0,0,0.95)' }}>
          <Ruler size={14} className="text-[#D4A574]" />
          <input
            autoFocus
            data-testid="measurement-input"
            placeholder='e.g. 24" or 6 ft'
            value={measurementInput}
            onChange={e => setMeasurementInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveMeasurement(editingMeasurement); }}
            className="px-3 py-1.5 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-sm focus:outline-none focus:border-[#D4A574] w-40"
          />
          <button
            onClick={() => handleSaveMeasurement(editingMeasurement)}
            className="px-3 py-1.5 rounded text-xs font-bold text-white bg-green-600 hover:bg-green-500"
          >
            Save
          </button>
          <button
            onClick={() => { setEditingMeasurement(null); setMeasurementInput(''); }}
            className="px-2 py-1.5 rounded text-xs text-[#D4C5A9]/60 border border-[#B49B7E]/30"
          >
            Skip
          </button>
        </div>
      )}

      {/* Selected line actions */}
      {selectedLine && !editingMeasurement && !readOnly && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <button
            onClick={() => { setEditingMeasurement(selectedLine); setMeasurementInput(lines.find(l => l.id === selectedLine)?.measurement || ''); }}
            className="px-2 py-1 rounded text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-1"
            data-testid="edit-measurement-btn"
          >
            <Pencil size={10} /> Edit
          </button>
          <button
            onClick={() => handleDeleteLine(selectedLine)}
            className="px-2 py-1 rounded text-[10px] font-bold text-white bg-red-600 hover:bg-red-500 flex items-center gap-1"
            data-testid="delete-line-btn"
          >
            <Trash2 size={10} /> Delete
          </button>
        </div>
      )}

      {/* Lines summary */}
      {lines.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {lines.map(line => (
            <span
              key={line.id}
              onClick={() => { if (!readOnly) { setSelectedLine(line.id); setToolMode('select'); } }}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] cursor-pointer transition-all ${selectedLine === line.id ? 'ring-1 ring-white' : ''}`}
              style={{ background: `${line.color}22`, color: line.color, borderLeft: `2px solid ${line.color}` }}
            >
              <Ruler size={8} />
              {line.measurement || 'no measurement'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};


// ─── Main RoomFinishSchedule Component ────────────────────────────────
const RoomFinishSchedule = ({ projectId, roomId, roomName, onClose }) => {
  const [schedules, setSchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('tile');
  const [saving, setSaving] = useState(false);
  const [roomItems, setRoomItems] = useState([]);
  const [showAddMaterial, setShowAddMaterial] = useState(null);
  const [materialForm, setMaterialForm] = useState({ name: '', vendor: '', sku: '', size: '', color: '', image: '', link: '', position_label: '' });
  const [expandedSurfaces, setExpandedSurfaces] = useState({});
  const [showMeasurements, setShowMeasurements] = useState(true);
  const saveTimeoutRef = useRef(null);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/rooms/${roomId}/finish-schedules`);
      const data = await res.json();
      setSchedules(data);
      if (data.length > 0 && !activeSchedule) setActiveSchedule(data[0]);
    } catch (err) { console.error('Failed to fetch schedules:', err); }
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
            // Resolve the best image from all possible fields
            const bestImage = item.image_url || item.finish_image || item.image || (item.photos && item.photos.length > 0 ? item.photos[0] : '') || '';
            items.push({ ...item, categoryName: cat.name, subcategoryName: sub.name, _bestImage: bestImage });
          });
        });
      });
      setRoomItems(items);
    } catch (err) { console.error('Failed to fetch room items:', err); }
  }, [projectId, roomId]);

  useEffect(() => { fetchSchedules(); fetchRoomItems(); }, [fetchSchedules, fetchRoomItems]);

  // Auto-save helper for measurement lines
  const autoSave = useCallback(async (schedule) => {
    if (!schedule) return;
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/finish-schedules/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surfaces: schedule.surfaces,
          measurement_lines: schedule.measurement_lines || []
        })
      });
      const updated = await res.json();
      setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
      return updated;
    } catch (err) { console.error('Failed to save:', err); }
  }, [projectId]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/rooms/${roomId}/finish-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_type: newType, name: newName.trim() })
      });
      const schedule = await res.json();
      setSchedules(prev => [...prev, schedule]);
      setActiveSchedule(schedule);
      setShowCreate(false);
      setNewName('');
    } catch (err) { console.error('Failed to create schedule:', err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await fetch(`${API_URL}/api/projects/${projectId}/finish-schedules/${scheduleId}`, { method: 'DELETE' });
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      if (activeSchedule?.id === scheduleId) setActiveSchedule(null);
    } catch (err) { console.error('Failed to delete:', err); }
  };

  const handleAddMaterial = async (surfaceId) => {
    if (!activeSchedule) return;
    setSaving(true);
    const updatedSurfaces = activeSchedule.surfaces.map(s => {
      if (s.id !== surfaceId) return s;
      return { ...s, materials: [...s.materials, { id: crypto.randomUUID(), ...materialForm }] };
    });
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/finish-schedules/${activeSchedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surfaces: updatedSurfaces })
      });
      const updated = await res.json();
      setActiveSchedule(updated);
      setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
      setShowAddMaterial(null);
      setMaterialForm({ name: '', vendor: '', sku: '', size: '', color: '', image: '', link: '', position_label: '' });
    } catch (err) { console.error('Failed to add material:', err); }
    finally { setSaving(false); }
  };

  const handleRemoveMaterial = async (surfaceId, materialId) => {
    if (!activeSchedule) return;
    const updatedSurfaces = activeSchedule.surfaces.map(s => {
      if (s.id !== surfaceId) return s;
      return { ...s, materials: s.materials.filter(m => m.id !== materialId) };
    });
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/finish-schedules/${activeSchedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surfaces: updatedSurfaces })
      });
      const updated = await res.json();
      setActiveSchedule(updated);
      setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (err) { console.error('Failed to remove material:', err); }
  };

  const handleAddFromItem = (item) => {
    setMaterialForm({
      name: item.name || '',
      vendor: item.vendor || '',
      sku: item.sku || '',
      size: item.size || '',
      color: item.finish_color || item.color || '',
      image: item._bestImage || item.image_url || item.finish_image || item.image || '',
      link: item.link || '',
      position_label: '',
      item_id: item.id,
    });
  };

  const handleAddSurface = async () => {
    if (!activeSchedule) return;
    const name = prompt('Surface name (e.g., "Accent Niche", "Window Sill"):');
    if (!name) return;
    const updatedSurfaces = [...activeSchedule.surfaces, { id: crypto.randomUUID(), name, surface_type: 'wall', materials: [], measurement_lines: [] }];
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/finish-schedules/${activeSchedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surfaces: updatedSurfaces })
      });
      const updated = await res.json();
      setActiveSchedule(updated);
      setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (err) { console.error('Failed to add surface:', err); }
  };

  const handleRemoveSurface = async (surfaceId) => {
    if (!activeSchedule || !window.confirm('Delete this surface?')) return;
    const updatedSurfaces = activeSchedule.surfaces.filter(s => s.id !== surfaceId);
    const updated = await autoSave({ ...activeSchedule, surfaces: updatedSurfaces });
    if (updated) setActiveSchedule(updated);
  };

  // Handle measurement lines change (debounced auto-save)
  const handleMeasurementLinesChange = (newLines) => {
    const updatedSchedule = { ...activeSchedule, measurement_lines: newLines };
    setActiveSchedule(updatedSchedule);
    // Debounce auto-save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => autoSave(updatedSchedule), 1000);
  };

  // Handle per-surface measurement lines
  const handleSurfaceLinesChange = (surfaceId, newLines) => {
    const updatedSurfaces = activeSchedule.surfaces.map(s =>
      s.id === surfaceId ? { ...s, measurement_lines: newLines } : s
    );
    const updatedSchedule = { ...activeSchedule, surfaces: updatedSurfaces };
    setActiveSchedule(updatedSchedule);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => autoSave(updatedSchedule), 1000);
  };

  const toggleSurface = (id) => {
    setExpandedSurfaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div className="text-center py-12 text-[#D4C5A9]/60">Loading schedules...</div>;

  return (
    <div data-testid="room-finish-schedule" className="rounded-2xl border border-[#B49B7E]/30 p-4" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.9) 50%, rgba(0,0,0,0.95) 100%)' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-white" data-testid="schedule-header">Room Finish Schedules</h3>
          <div className="text-sm text-[#B49B7E]">{roomName}</div>
        </div>
        <div className="flex gap-2">
          <button
            data-testid="create-schedule-btn"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #D4A574 0%, #8B7355 100%)' }}
          >
            <Plus size={14} className="inline mr-1" /> New Schedule
          </button>
          {onClose && (
            <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm text-[#D4C5A9]/60 hover:text-white border border-[#B49B7E]/30">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mb-4 p-4 rounded-lg border border-[#B49B7E]/30" style={{ background: 'rgba(30,30,40,0.9)' }}>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              data-testid="schedule-name-input"
              placeholder="Schedule name (e.g., Primary Shower)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              className="px-3 py-2 rounded-lg border border-[#B49B7E] bg-black/50 text-white focus:outline-none focus:border-[#D4A574]"
            />
            <div className="flex gap-2">
              {SCHEDULE_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setNewType(t.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${newType === t.value ? 'text-white' : 'text-[#D4C5A9]/50 border border-[#B49B7E]/20'}`}
                  style={newType === t.value ? { background: 'linear-gradient(135deg, #D4A574 0%, #8B7355 100%)' } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={saving || !newName.trim()} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50">
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-[#D4C5A9]/60 border border-[#B49B7E]/30">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tabs */}
      {schedules.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {schedules.map(s => (
            <button
              key={s.id}
              data-testid={`schedule-tab-${s.id}`}
              onClick={() => setActiveSchedule(s)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeSchedule?.id === s.id ? 'text-white' : 'text-[#D4C5A9]/60 border border-[#B49B7E]/20 hover:border-[#B49B7E]/50'}`}
              style={activeSchedule?.id === s.id ? { background: 'linear-gradient(135deg, #D4A574 0%, #8B7355 100%)' } : {}}
            >
              {s.name}
              <span className="ml-2 text-[10px] opacity-60">({SCHEDULE_TYPES.find(t => t.value === s.schedule_type)?.label || s.schedule_type})</span>
            </button>
          ))}
        </div>
      )}

      {/* Active Schedule Content */}
      {activeSchedule ? (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-base font-bold text-[#D4A574]">{activeSchedule.name}</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMeasurements(!showMeasurements)}
                className={`px-3 py-1 rounded text-xs flex items-center gap-1 ${showMeasurements ? 'text-white bg-blue-600' : 'text-[#D4C5A9]/60 border border-[#B49B7E]/20'}`}
                data-testid="toggle-measurements-btn"
              >
                <Ruler size={12} /> Measurements
              </button>
              <button onClick={handleAddSurface} className="px-3 py-1 rounded text-xs text-white bg-blue-700 hover:bg-blue-600 flex items-center gap-1" data-testid="add-surface-btn">
                <Plus size={12} /> Surface
              </button>
              <button onClick={() => handleDelete(activeSchedule.id)} className="px-3 py-1 rounded text-xs text-white bg-red-700 hover:bg-red-600 flex items-center gap-1">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>

          {/* Global Measurement Canvas */}
          {showMeasurements && (
            <div className="mb-4">
              <div className="text-xs text-[#B49B7E] mb-1 flex items-center gap-1">
                <Ruler size={10} /> Overall room measurements — draw lines with dimensions
              </div>
              <MeasurementCanvas
                lines={activeSchedule.measurement_lines || []}
                onLinesChange={handleMeasurementLinesChange}
              />
            </div>
          )}

          {/* Surfaces Grid */}
          <div className="space-y-3">
            {activeSchedule.surfaces.map(surface => {
              const isExpanded = expandedSurfaces[surface.id] !== false;
              const typeInfo = SURFACE_TYPES[surface.surface_type] || SURFACE_TYPES.wall;

              return (
                <div key={surface.id} className="rounded-lg border border-[#B49B7E]/30 overflow-hidden" style={{ background: 'rgba(15,15,25,0.8)' }} data-testid={`surface-${surface.id}`}>
                  {/* Surface Header */}
                  <div
                    className="flex justify-between items-center px-3 py-2 cursor-pointer"
                    style={{ background: `${typeInfo.color}15`, borderBottom: `1px solid ${typeInfo.color}30` }}
                    onClick={() => toggleSurface(surface.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs" style={{ color: typeInfo.color }}>{typeInfo.icon}</span>
                      <span className="text-white font-bold text-sm">{surface.name}</span>
                      <span className="text-[#B49B7E]/40 text-xs">
                        ({surface.materials.length} material{surface.materials.length !== 1 ? 's' : ''})
                        {(surface.measurement_lines || []).length > 0 && (
                          <span className="ml-1 text-blue-400">+ {surface.measurement_lines.length} line{surface.measurement_lines.length !== 1 ? 's' : ''}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        data-testid={`add-material-${surface.id}`}
                        onClick={(e) => { e.stopPropagation(); setShowAddMaterial(surface.id); setMaterialForm({ name: '', vendor: '', sku: '', size: '', color: '', image: '', link: '', position_label: '' }); }}
                        className="px-2 py-1 rounded text-xs font-bold text-white bg-green-700 hover:bg-green-600"
                      >
                        + Material
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveSurface(surface.id); }}
                        className="px-1 py-1 rounded text-[#D4C5A9]/30 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                      {isExpanded ? <ChevronUp size={14} className="text-[#B49B7E]/40" /> : <ChevronDown size={14} className="text-[#B49B7E]/40" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3">
                      {/* Per-surface measurement canvas */}
                      {showMeasurements && (
                        <div className="mb-3">
                          <div className="text-[10px] text-[#B49B7E]/50 mb-1 flex items-center gap-1">
                            <Ruler size={8} /> {surface.name} measurements
                          </div>
                          <MeasurementCanvas
                            lines={surface.measurement_lines || []}
                            onLinesChange={(newLines) => handleSurfaceLinesChange(surface.id, newLines)}
                          />
                        </div>
                      )}

                      {/* Materials as tile swatches */}
                      {surface.materials.length === 0 ? (
                        <div className="text-center py-3 text-[#B49B7E]/30 text-xs italic">No materials assigned</div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {surface.materials.map(mat => (
                            <div key={mat.id} className="group relative" data-testid={`tile-swatch-${mat.id}`}>
                              <div
                                className="w-24 h-24 rounded-lg border-2 border-[#B49B7E]/40 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-[#D4A574] hover:scale-105"
                                onClick={() => { if (mat.link) window.open(mat.link, '_blank'); }}
                              >
                                {mat.image ? (
                                  <img src={mat.image} alt={mat.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; e.target.parentElement.style.background = '#333'; }} />
                                ) : mat.color ? (
                                  <div className="w-full h-full" style={{ background: mat.color }} />
                                ) : (
                                  <span className="text-white text-[10px] text-center px-1 leading-tight">{mat.name?.substring(0, 20) || '?'}</span>
                                )}
                              </div>
                              {mat.position_label && (
                                <div className="text-center text-[10px] text-[#B49B7E] mt-1 truncate w-24">{mat.position_label}</div>
                              )}
                              <div className="text-center text-[9px] text-[#B49B7E]/50 truncate w-24">{mat.name}</div>
                              {/* Hover Tooltip */}
                              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-52 p-2 rounded-lg border border-[#B49B7E]/40 text-xs shadow-xl" style={{ background: 'rgba(0,0,0,0.95)' }}>
                                {mat.image && (
                                  <img src={mat.image} alt={mat.name} className="w-full h-28 object-cover rounded mb-2" />
                                )}
                                <div className="text-white font-bold">{mat.name}</div>
                                {mat.vendor && <div className="text-[#B49B7E]">Vendor: {mat.vendor}</div>}
                                {mat.sku && <div className="text-[#B49B7E]">SKU: {mat.sku}</div>}
                                {mat.size && <div className="text-[#B49B7E]">Size: {mat.size}</div>}
                                {mat.color && <div className="text-[#B49B7E]">Color: {mat.color}</div>}
                                {mat.link && <div className="text-blue-400 underline">Click to view</div>}
                              </div>
                              {/* Remove Button */}
                              <button
                                onClick={() => handleRemoveMaterial(surface.id, mat.id)}
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                x
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Material Form (inline) */}
                      {showAddMaterial === surface.id && (
                        <div className="mt-3 p-3 rounded-lg border-t border-[#B49B7E]/20" style={{ background: 'rgba(30,30,40,0.9)' }}>
                          {/* Visual item picker - shows actual images from checklist/FFE */}
                          {roomItems.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs font-bold text-[#D4A574] mb-2">Select from Checklist / FF&E items:</div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-1">
                                {roomItems.map(item => {
                                  const img = item._bestImage;
                                  const isSelected = materialForm.item_id === item.id;
                                  return (
                                    <button
                                      key={item.id}
                                      onClick={() => handleAddFromItem(item)}
                                      data-testid={`pick-item-${item.id}`}
                                      className={`relative rounded-lg border-2 overflow-hidden transition-all text-left group ${isSelected ? 'border-[#D4A574] ring-2 ring-[#D4A574]/50 scale-105' : 'border-[#B49B7E]/20 hover:border-[#B49B7E]/60'}`}
                                      style={{ background: 'rgba(0,0,0,0.5)' }}
                                    >
                                      {/* Image */}
                                      <div
                                        className="w-full aspect-square flex items-center justify-center overflow-hidden"
                                        style={img ? { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: '#222' }}
                                      >
                                        {!img && (
                                          <span className="text-[#B49B7E]/30 text-[10px] text-center px-1">No image</span>
                                        )}
                                      </div>
                                      {/* Item info */}
                                      <div className="p-1.5">
                                        <div className="text-white text-[10px] font-bold leading-tight truncate">{item.name || 'Unnamed'}</div>
                                        {item.vendor && <div className="text-[#B49B7E]/60 text-[9px] truncate">{item.vendor}</div>}
                                        {item.finish_color && <div className="text-[#B49B7E]/40 text-[9px] truncate">{item.finish_color}</div>}
                                        {item.status && (
                                          <div className={`text-[8px] font-bold mt-0.5 ${item.status === 'APPROVED' ? 'text-green-400' : 'text-[#B49B7E]/40'}`}>
                                            {item.status}
                                          </div>
                                        )}
                                      </div>
                                      {/* Selected checkmark */}
                                      {isSelected && (
                                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#D4A574] flex items-center justify-center">
                                          <span className="text-white text-[10px] font-bold">&#10003;</span>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Selected item preview + form fields */}
                          {materialForm.name && (
                            <div className="mb-3 p-2 rounded-lg border border-[#D4A574]/30 flex gap-3 items-center" style={{ background: 'rgba(212,165,116,0.08)' }}>
                              {materialForm.image ? (
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-[#B49B7E]/30">
                                  <img src={materialForm.image} alt={materialForm.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-lg flex-shrink-0 bg-[#333] flex items-center justify-center border border-[#B49B7E]/30">
                                  <span className="text-[#B49B7E]/40 text-[10px]">No img</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm font-bold truncate">{materialForm.name}</div>
                                {materialForm.vendor && <div className="text-[#B49B7E] text-xs">{materialForm.vendor}</div>}
                                <div className="text-[#B49B7E]/50 text-[10px]">
                                  {[materialForm.sku, materialForm.size, materialForm.color].filter(Boolean).join(' | ')}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Manual fields (collapsed by default if an item was picked) */}
                          <details className={materialForm.item_id ? '' : 'open'}>
                            <summary className="text-[10px] text-[#B49B7E]/50 cursor-pointer mb-2 hover:text-[#B49B7E]">
                              {materialForm.item_id ? 'Edit details or enter manually' : 'Enter material details'}
                            </summary>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <input placeholder="Material name" value={materialForm.name} onChange={e => setMaterialForm(p => ({...p, name: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                              <input placeholder="Vendor" value={materialForm.vendor} onChange={e => setMaterialForm(p => ({...p, vendor: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                              <input placeholder="SKU" value={materialForm.sku} onChange={e => setMaterialForm(p => ({...p, sku: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                              <input placeholder='Size (e.g., 12x24)' value={materialForm.size} onChange={e => setMaterialForm(p => ({...p, size: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                              <input placeholder="Color" value={materialForm.color} onChange={e => setMaterialForm(p => ({...p, color: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                              <input placeholder="Image URL" value={materialForm.image} onChange={e => setMaterialForm(p => ({...p, image: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                              <input placeholder="Product link" value={materialForm.link} onChange={e => setMaterialForm(p => ({...p, link: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                              <input placeholder="Position (e.g., Upper, Border)" value={materialForm.position_label} onChange={e => setMaterialForm(p => ({...p, position_label: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                            </div>
                          </details>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleAddMaterial(surface.id)} disabled={saving || !materialForm.name} className="px-4 py-1.5 rounded text-xs font-bold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50">
                              {saving ? 'Adding...' : 'Add Material'}
                            </button>
                            <button onClick={() => setShowAddMaterial(null)} className="px-3 py-1.5 rounded text-xs text-[#D4C5A9]/60 border border-[#B49B7E]/30">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-12">
          <Ruler size={32} className="mx-auto mb-3 text-[#B49B7E]/30" />
          <div className="text-[#D4C5A9]/40 text-lg mb-2">No finish schedules yet</div>
          <div className="text-[#B49B7E]/40 text-sm">Create a Tile Schedule, Paint/Wallpaper, or Wood/Mixed schedule for this room</div>
        </div>
      ) : null}
    </div>
  );
};

export default RoomFinishSchedule;

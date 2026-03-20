import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ruler, Plus, Trash2, MousePointer, X, Pencil, ChevronDown } from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

const SCHEDULE_TYPES = [
  { value: 'tile', label: 'Tile' },
  { value: 'paint_wallpaper', label: 'Paint / Wallpaper' },
  { value: 'wood_mixed', label: 'Wood / Mixed' },
];

const TILE_PATTERNS = [
  { value: 'stacked_horizontal', label: 'Stacked Horizontal' },
  { value: 'stacked_vertical', label: 'Stacked Vertical' },
  { value: 'offset', label: 'Offset (Brick Lay)' },
  { value: 'one_third_offset', label: '1/3 Offset' },
  { value: 'herringbone', label: 'Herringbone' },
  { value: 'block_herringbone', label: 'Block Herringbone' },
  { value: 'basket_weave', label: 'Basket Weave' },
  { value: 'stepladder', label: 'Stepladder' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'mosaic', label: 'Mosaic' },
  { value: 'random', label: 'Random' },
  { value: 'none', label: 'None / Solid' },
];

// SVG pattern preview thumbnails
const PatternSvg = ({ pattern, size = 60, color = '#6B8EAE' }) => {
  const s = size;
  const stroke = '#555';
  const fill = '#e8e8e8';
  const sw = 0.8;
  switch (pattern) {
    case 'stacked_horizontal':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#f0f0f0"/>{[0,10,20,30].map(y => <>{[0,20].map(x => <rect key={`${x}-${y}`} x={x+0.5} y={y+0.5} width={19} height={9} fill={fill} stroke={stroke} strokeWidth={sw}/>)}</>)}</svg>);
    case 'stacked_vertical':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#f0f0f0"/>{[0,10,20,30].map(x => <>{[0,20].map(y => <rect key={`${x}-${y}`} x={x+0.5} y={y+0.5} width={9} height={19} fill={fill} stroke={stroke} strokeWidth={sw}/>)}</>)}</svg>);
    case 'offset':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#f0f0f0"/>{[0,10,20,30].map((y,i) => <>{[-10+((i%2)*10),10+((i%2)*10),30+((i%2)*10)].map(x => <rect key={`${x}-${y}`} x={x+0.5} y={y+0.5} width={19} height={9} fill={fill} stroke={stroke} strokeWidth={sw}/>)}</>)}</svg>);
    case 'one_third_offset':
      return (<svg width={s} height={s} viewBox="0 0 42 40"><rect width="42" height="40" fill="#f0f0f0"/>{[0,10,20,30].map((y,i) => {const off=(i%3)*7; return [-14+off,7+off,28+off].map(x => <rect key={`${x}-${y}`} x={x+0.5} y={y+0.5} width={20} height={9} fill={fill} stroke={stroke} strokeWidth={sw}/>);})}</svg>);
    case 'herringbone':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#f0f0f0"/><g transform="translate(20,20)">{[-1,0,1].map(row => [-1,0,1].map(col => <g key={`${row}-${col}`} transform={`translate(${col*16},${row*16})`}><rect x="-1" y="-8" width="4" height="15" rx="0.3" fill={fill} stroke={stroke} strokeWidth={sw} transform="rotate(45)"/><rect x="-1" y="-8" width="4" height="15" rx="0.3" fill={fill} stroke={stroke} strokeWidth={sw} transform="rotate(-45) translate(0,-2)"/></g>))}</g></svg>);
    case 'block_herringbone':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#f0f0f0"/>{[0,20].map(y => [0,20].map(x => <g key={`${x}-${y}`}><rect x={x+1} y={y+1} width={8} height={18} fill={fill} stroke={stroke} strokeWidth={sw}/><rect x={x+11} y={y+1} width={8} height={18} fill={fill} stroke={stroke} strokeWidth={sw}/></g>))}{[10,30].map(y => [0,20].map(x => <g key={`v${x}-${y}`}><rect x={x+1} y={y+1} width={18} height={8} fill={fill} stroke={stroke} strokeWidth={sw}/></g>))}</svg>);
    case 'basket_weave':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#f0f0f0"/>{[0,20].map(y => [0,20].map(x => <g key={`${x}-${y}`}><rect x={x+1} y={y+1} width={18} height={8} fill={fill} stroke={stroke} strokeWidth={sw}/><rect x={x+1} y={y+11} width={18} height={8} fill={fill} stroke={stroke} strokeWidth={sw}/></g>))}{[0,20].map(y => [10,30].map(x => <g key={`v${x}-${y}`}><rect x={x+1} y={y+1} width={8} height={18} fill={fill} stroke={stroke} strokeWidth={sw}/></g>))}</svg>);
    case 'stepladder':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#f0f0f0"/>{[0,8,16,24,32].map((x,i) => {const off=(i%2)*10; return [-10+off,10+off,30+off].map(y => <rect key={`${x}-${y}`} x={x+0.5} y={y+0.5} width={7} height={19} fill={fill} stroke={stroke} strokeWidth={sw}/>);})}</svg>);
    case 'diagonal':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#f0f0f0"/><g transform="translate(20,20) rotate(45)">{[-20,-10,0,10].map(y => [-30,-10,10].map(x => <rect key={`${x}-${y}`} x={x+0.5} y={y+0.5} width={19} height={9} fill={fill} stroke={stroke} strokeWidth={sw}/>))}</g></svg>);
    case 'mosaic':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#f0f0f0"/>{[0,8,16,24,32].map(y => [0,8,16,24,32].map(x => <rect key={`${x}-${y}`} x={x+0.5} y={y+0.5} width={7} height={7} rx="0.3" fill={fill} stroke={stroke} strokeWidth={sw}/>))}</svg>);
    default:
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#f0f0f0"/><rect x="1" y="1" width="38" height="38" fill={fill} stroke={stroke} strokeWidth={sw}/></svg>);
  }
};

const LINE_COLORS = ['#FF4444', '#44AAFF', '#44FF44', '#FFAA44', '#FF44FF', '#FFFFFF'];

const getItemImage = (item) =>
  item.image_url || item.finish_image || item.image || (item.photos?.length ? item.photos[0] : '') || '';

// ─── MEASUREMENT CANVAS ──────────────────────────────────────────────
const MeasurementCanvas = ({ lines = [], onLinesChange }) => {
  const svgRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentMouse, setCurrentMouse] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [inputVal, setInputVal] = useState('');
  const [selectedLine, setSelectedLine] = useState(null);
  const [activeColor, setActiveColor] = useState('#FF4444');
  const [toolMode, setToolMode] = useState('draw');

  const getSvgPoint = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 };
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => setToolMode(toolMode === 'draw' ? 'select' : 'draw')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${toolMode === 'draw' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'}`}>
          {toolMode === 'draw' ? <><Ruler size={10} /> Drawing</> : <><MousePointer size={10} /> Selecting</>}
        </button>
        <div className="flex gap-0.5">{LINE_COLORS.map(c => <button key={c} onClick={() => setActiveColor(c)} className={`w-3.5 h-3.5 rounded-full border ${activeColor === c ? 'border-white scale-125' : 'border-transparent'}`} style={{ background: c }} />)}</div>
        {selectedLine && <>
          <button onClick={() => { setEditingId(selectedLine); setInputVal(lines.find(l => l.id === selectedLine)?.measurement || ''); }} className="ml-auto px-2 py-0.5 rounded text-[10px] text-white bg-blue-600"><Pencil size={8} className="inline mr-1" />Edit</button>
          <button onClick={() => { onLinesChange(lines.filter(l => l.id !== selectedLine)); setSelectedLine(null); }} className="px-2 py-0.5 rounded text-[10px] text-white bg-red-600"><Trash2 size={8} className="inline mr-1" />Del</button>
        </>}
        <span className="text-[9px] text-[#B49B7E]/30 ml-auto">{toolMode === 'draw' ? 'Click + drag' : 'Click line'}</span>
      </div>
      <svg ref={svgRef} viewBox="0 0 100 60" className="w-full border border-[#B49B7E]/15 rounded" style={{ height: '120px', background: 'rgba(10,10,18,0.4)', cursor: toolMode === 'draw' ? 'crosshair' : 'default' }}
        onMouseDown={(e) => { if (toolMode !== 'draw') return; e.preventDefault(); const pt = getSvgPoint(e); setDrawing(true); setDrawStart(pt); setCurrentMouse(pt); }}
        onMouseMove={(e) => { if (drawing) setCurrentMouse(getSvgPoint(e)); }}
        onMouseUp={(e) => {
          if (!drawing || !drawStart) return;
          const end = getSvgPoint(e);
          if (Math.abs(end.x - drawStart.x) < 1 && Math.abs(end.y - drawStart.y) < 1) { setDrawing(false); setDrawStart(null); return; }
          const nl = { id: crypto.randomUUID(), start_x: drawStart.x, start_y: drawStart.y, end_x: end.x, end_y: end.y, measurement: '', color: activeColor, thickness: 2 };
          onLinesChange([...lines, nl]); setDrawing(false); setDrawStart(null); setEditingId(nl.id); setInputVal('');
        }}
        onMouseLeave={() => { if (drawing) { setDrawing(false); setDrawStart(null); } }}
      >
        <defs><pattern id="mgrid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(180,155,126,0.06)" strokeWidth="0.1" /></pattern></defs>
        <rect width="100" height="60" fill="url(#mgrid)" />
        {lines.map(line => {
          const mx = (line.start_x + line.end_x) / 2, my = (line.start_y + line.end_y) / 2;
          const angle = Math.atan2(line.end_y - line.start_y, line.end_x - line.start_x) * 180 / Math.PI;
          const rad = angle * Math.PI / 180;
          const da = angle > 90 || angle < -90 ? angle + 180 : angle;
          return (
            <g key={line.id}>
              <line x1={line.start_x} y1={line.start_y} x2={line.end_x} y2={line.end_y} stroke={line.color} strokeWidth={0.6} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); if (toolMode === 'select') setSelectedLine(selectedLine === line.id ? null : line.id); }} />
              <line x1={line.start_x - 1 * Math.sin(rad)} y1={line.start_y + 1 * Math.cos(rad)} x2={line.start_x + 1 * Math.sin(rad)} y2={line.start_y - 1 * Math.cos(rad)} stroke={line.color} strokeWidth={0.25} />
              <line x1={line.end_x - 1 * Math.sin(rad)} y1={line.end_y + 1 * Math.cos(rad)} x2={line.end_x + 1 * Math.sin(rad)} y2={line.end_y - 1 * Math.cos(rad)} stroke={line.color} strokeWidth={0.25} />
              {line.measurement && <g transform={`translate(${mx + 1.5 * Math.sin(rad)}, ${my - 1.5 * Math.cos(rad)}) rotate(${da})`}><rect x={-line.measurement.length * 0.8} y="-2" width={line.measurement.length * 1.6} height="3.5" rx="0.5" fill="rgba(0,0,0,0.9)" stroke={line.color} strokeWidth="0.15" /><text textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="2" fontFamily="monospace" fontWeight="bold">{line.measurement}</text></g>}
              {selectedLine === line.id && <><circle cx={line.start_x} cy={line.start_y} r="1" fill={line.color} stroke="white" strokeWidth="0.25" /><circle cx={line.end_x} cy={line.end_y} r="1" fill={line.color} stroke="white" strokeWidth="0.25" /></>}
            </g>
          );
        })}
        {drawing && drawStart && currentMouse && <line x1={drawStart.x} y1={drawStart.y} x2={currentMouse.x} y2={currentMouse.y} stroke={activeColor} strokeWidth={0.5} strokeDasharray="1 0.5" opacity={0.7} />}
      </svg>
      {editingId && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 items-center p-2 rounded-lg border border-[#B49B7E]/40 shadow-xl z-30" style={{ background: 'rgba(0,0,0,0.95)' }}>
          <input autoFocus placeholder='e.g. 24" or 6 ft' value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { onLinesChange(lines.map(l => l.id === editingId ? { ...l, measurement: inputVal } : l)); setEditingId(null); } }} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs w-28 focus:outline-none" data-testid="measurement-input" />
          <button onClick={() => { onLinesChange(lines.map(l => l.id === editingId ? { ...l, measurement: inputVal } : l)); setEditingId(null); }} className="px-2 py-1 rounded text-[10px] font-bold text-white bg-green-600">OK</button>
          <button onClick={() => setEditingId(null)} className="px-2 py-1 rounded text-[10px] text-[#D4C5A9]/50">Skip</button>
        </div>
      )}
    </div>
  );
};

// ─── WALL ELEVATION DIAGRAM ──────────────────────────────────────────
const WallDiagram = ({ surface, selectedItem, onPlaceItem, onRemoveMaterial, onChangePattern }) => {
  const defaultZones = [
    { id: 'ceiling', label: 'Ceiling', top: 0, height: 8 },
    { id: 'upper_wall', label: 'Upper Wall / Accent', top: 8, height: 18 },
    { id: 'main_wall', label: 'Main Wall', top: 26, height: 38 },
    { id: 'stool', label: 'Stool / Chair Rail', top: 64, height: 7 },
    { id: 'curb', label: 'Curb / Wainscot', top: 71, height: 13 },
    { id: 'floor', label: 'Floor', top: 84, height: 16 },
  ];

  const zoneMap = {};
  (surface.materials || []).forEach(mat => {
    if (mat.position_label) zoneMap[mat.position_label] = mat;
  });

  const [patternPickerZone, setPatternPickerZone] = useState(null);

  return (
    <div data-testid={`wall-diagram-${surface.id}`}>
      <div className="relative w-full rounded-lg overflow-hidden border-2 border-[#B49B7E]/30" style={{ height: '380px', background: '#18181f' }}>
        {defaultZones.map(zone => {
          const mat = zoneMap[zone.id];
          const hasImage = mat?.image;
          const isSelected = selectedItem !== null;

          return (
            <div
              key={zone.id}
              className={`absolute left-0 right-0 border-b border-[#B49B7E]/10 cursor-pointer transition-all group ${isSelected ? 'hover:ring-2 hover:ring-[#D4A574] hover:z-10' : 'hover:ring-1 hover:ring-[#B49B7E]/20'}`}
              style={{
                top: `${zone.top}%`,
                height: `${zone.height}%`,
                backgroundImage: hasImage ? `url(${mat.image})` : 'none',
                backgroundSize: hasImage ? '120px 120px' : 'auto',
                backgroundRepeat: 'repeat',
                backgroundColor: hasImage ? 'transparent' : 'rgba(180,155,126,0.03)',
              }}
              onClick={() => {
                if (selectedItem) {
                  onPlaceItem(surface.id, zone.id, selectedItem);
                }
              }}
            >
              <div className={`absolute inset-0 flex items-center justify-between px-3 ${hasImage ? 'bg-black/35' : ''}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold ${hasImage ? 'text-white drop-shadow' : 'text-[#B49B7E]/30'}`}>{zone.label}</span>
                  {mat && (
                    <>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap" style={{ background: 'rgba(0,0,0,0.75)' }}>
                        {mat.name} {mat.size ? `(${mat.size})` : ''} {mat.vendor ? `- ${mat.vendor}` : ''}
                      </span>
                      {mat.pattern && mat.pattern !== 'none' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-[#D4A574] font-bold" style={{ background: 'rgba(0,0,0,0.75)' }}>
                          <span className="inline-block" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}><PatternSvg pattern={mat.pattern} size={16} /></span>
                          {TILE_PATTERNS.find(p => p.value === mat.pattern)?.label || mat.pattern}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {mat && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPatternPickerZone(patternPickerZone === zone.id ? null : zone.id); }}
                        className="px-1.5 py-0.5 rounded text-[9px] text-[#D4A574] font-bold border border-[#D4A574]/40 hover:bg-[#D4A574]/20"
                        data-testid={`pattern-btn-${zone.id}`}
                      >
                        Pattern
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveMaterial(surface.id, mat.id); }}
                        className="px-1.5 py-0.5 rounded text-[9px] text-red-400 bg-red-600/20 hover:bg-red-600/40"
                      >
                        <Trash2 size={10} className="inline" />
                      </button>
                    </>
                  )}
                  {!mat && isSelected && (
                    <span className="px-2 py-0.5 rounded text-[10px] text-green-300 font-bold animate-pulse" style={{ background: 'rgba(0,0,0,0.7)' }}>
                      Click to place here
                    </span>
                  )}
                </div>
              </div>

              {/* Pattern picker dropdown */}
              {patternPickerZone === zone.id && mat && (
                <div className="absolute z-30 right-2 top-full mt-1 p-3 rounded-lg border border-[#B49B7E]/30 shadow-xl" style={{ background: 'rgba(0,0,0,0.97)', width: '340px' }} onClick={e => e.stopPropagation()}>
                  <div className="text-[10px] text-[#D4A574] font-bold mb-2">Select Tile Pattern:</div>
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {TILE_PATTERNS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => { onChangePattern(surface.id, mat.id, p.value); setPatternPickerZone(null); }}
                        className={`flex flex-col items-center p-1.5 rounded-lg border-2 transition-all ${mat.pattern === p.value ? 'border-[#D4A574] bg-[#D4A574]/10' : 'border-[#B49B7E]/15 hover:border-[#B49B7E]/40'}`}
                      >
                        <PatternSvg pattern={p.value} size={56} />
                        <span className={`text-[8px] font-bold mt-1 text-center leading-tight ${mat.pattern === p.value ? 'text-[#D4A574]' : 'text-[#D4C5A9]/50'}`}>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────
const RoomFinishSchedule = ({ projectId, roomId, roomName, onClose }) => {
  const [schedules, setSchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('tile');
  const [saving, setSaving] = useState(false);
  const [roomItems, setRoomItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); // item currently picked from palette
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

  const save = useCallback(async (schedule) => {
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
    saveTimeoutRef.current = setTimeout(() => save(schedule), 600);
  }, [save]);

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

  const placeItemOnZone = (surfaceId, zoneId, item) => {
    if (!activeSchedule) return;
    const updatedSurfaces = activeSchedule.surfaces.map(s => {
      if (s.id !== surfaceId) return s;
      const filtered = s.materials.filter(m => m.position_label !== zoneId);
      const newMat = {
        id: crypto.randomUUID(), item_id: item.id, name: item.name || '', vendor: item.vendor || '',
        sku: item.sku || '', size: item.size || '', color: item.finish_color || item.color || '',
        image: item._img || '', link: item.link || '', position_label: zoneId, pattern: '',
      };
      return { ...s, materials: [...filtered, newMat] };
    });
    const updated = { ...activeSchedule, surfaces: updatedSurfaces };
    setActiveSchedule(updated);
    debouncedSave(updated);
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

  const changePattern = (surfaceId, materialId, pattern) => {
    if (!activeSchedule) return;
    const updatedSurfaces = activeSchedule.surfaces.map(s => {
      if (s.id !== surfaceId) return s;
      return { ...s, materials: s.materials.map(m => m.id === materialId ? { ...m, pattern } : m) };
    });
    const updated = { ...activeSchedule, surfaces: updatedSurfaces };
    setActiveSchedule(updated);
    debouncedSave(updated);
  };

  const addSurface = () => {
    if (!activeSchedule) return;
    const name = prompt('Surface name (e.g., "Shower Niche", "Tub Surround"):');
    if (!name) return;
    const updated = { ...activeSchedule, surfaces: [...activeSchedule.surfaces, { id: crypto.randomUUID(), name, surface_type: 'wall', materials: [], measurement_lines: [] }] };
    setActiveSchedule(updated);
    debouncedSave(updated);
  };

  const removeSurface = (surfaceId) => {
    if (!activeSchedule || !window.confirm('Remove this wall?')) return;
    const updated = { ...activeSchedule, surfaces: activeSchedule.surfaces.filter(s => s.id !== surfaceId) };
    setActiveSchedule(updated);
    debouncedSave(updated);
  };

  const handleLinesChange = (newLines) => {
    const updated = { ...activeSchedule, measurement_lines: newLines };
    setActiveSchedule(updated);
    debouncedSave(updated);
  };

  if (loading) return <div className="text-center py-8 text-[#D4C5A9]/60">Loading...</div>;

  const itemsWithImages = roomItems.filter(i => i._img);
  const itemsNoImages = roomItems.filter(i => !i._img);

  return (
    <div data-testid="room-finish-schedule" className="rounded-xl border border-[#B49B7E]/20" style={{ background: 'rgba(0,0,0,0.9)' }}>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MATERIAL PALETTE — always visible at top                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="p-3 border-b border-[#B49B7E]/15" style={{ background: 'rgba(212,165,116,0.04)' }}>
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs font-bold text-[#D4A574]">
            Available Materials (from Checklist & FF&E)
            {selectedItem && (
              <span className="ml-3 text-green-400 animate-pulse">
                Selected: {selectedItem.name} — now click a zone on the wall below
              </span>
            )}
          </div>
          {selectedItem && (
            <button onClick={() => setSelectedItem(null)} className="px-2 py-1 rounded text-[10px] font-bold text-red-400 border border-red-400/30 hover:bg-red-400/10">
              <X size={10} className="inline mr-1" />Deselect
            </button>
          )}
        </div>
        {roomItems.length === 0 ? (
          <div className="text-[#B49B7E]/30 text-xs py-3 text-center">No items in this room yet — add items in the Checklist or FF&E tab first</div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {/* Items WITH images */}
            {itemsWithImages.map(item => (
              <button
                key={item.id}
                data-testid={`palette-item-${item.id}`}
                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                className={`flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all w-24 ${selectedItem?.id === item.id ? 'border-[#D4A574] ring-2 ring-[#D4A574]/40 scale-105' : 'border-[#B49B7E]/15 hover:border-[#B49B7E]/40'}`}
              >
                <img src={item._img} alt={item.name} className="w-full h-20 object-cover" />
                <div className="px-1 py-0.5">
                  <div className="text-white text-[8px] font-bold truncate">{item.name}</div>
                  <div className="text-[#B49B7E]/50 text-[7px] truncate">{item.vendor}{item.size ? ` | ${item.size}` : ''}</div>
                </div>
              </button>
            ))}
            {/* Items WITHOUT images */}
            {itemsNoImages.map(item => (
              <button
                key={item.id}
                data-testid={`palette-item-${item.id}`}
                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                className={`flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all w-24 ${selectedItem?.id === item.id ? 'border-[#D4A574] ring-2 ring-[#D4A574]/40 scale-105' : 'border-[#B49B7E]/10 hover:border-[#B49B7E]/30'}`}
              >
                <div className="w-full h-20 bg-[#1a1a24] flex items-center justify-center">
                  <span className="text-[#B49B7E]/20 text-[9px] text-center px-1">{item.name?.substring(0, 30)}</span>
                </div>
                <div className="px-1 py-0.5">
                  <div className="text-[#B49B7E]/50 text-[8px] font-bold truncate">{item.name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SCHEDULE CONTENT                                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="p-3">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-bold text-white">{roomName}</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 rounded text-xs font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #D4A574 0%, #8B7355 100%)' }} data-testid="create-schedule-btn"><Plus size={12} className="inline mr-1" />New Schedule</button>
            {onClose && <button onClick={onClose} className="px-2 py-1.5 rounded text-xs text-[#D4C5A9]/50 border border-[#B49B7E]/20"><X size={12} /></button>}
          </div>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="mb-3 p-3 rounded-lg border border-[#B49B7E]/20" style={{ background: 'rgba(30,30,40,0.9)' }}>
            <input type="text" data-testid="schedule-name-input" placeholder="Name (e.g., Primary Shower, Powder Room)" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }} className="w-full px-3 py-2 mb-2 rounded border border-[#B49B7E] bg-black/50 text-white text-sm focus:outline-none focus:border-[#D4A574]" />
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
              <button key={s.id} onClick={() => setActiveSchedule(s)} className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap ${activeSchedule?.id === s.id ? 'text-white' : 'text-[#D4C5A9]/40 border border-[#B49B7E]/15'}`} style={activeSchedule?.id === s.id ? { background: 'linear-gradient(135deg, #D4A574 0%, #8B7355 100%)' } : {}}>{s.name}</button>
            ))}
          </div>
        )}

        {activeSchedule ? (
          <div>
            {/* Action bar */}
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-bold text-[#D4A574]">{activeSchedule.name}</h4>
              <div className="flex gap-1">
                <button onClick={() => setShowMeasurements(!showMeasurements)} className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 ${showMeasurements ? 'bg-blue-600 text-white' : 'text-[#D4C5A9]/40 border border-[#B49B7E]/15'}`} data-testid="toggle-measurements-btn"><Ruler size={10} />Dimensions</button>
                <button onClick={addSurface} className="px-2 py-1 rounded text-[10px] text-white bg-blue-700" data-testid="add-surface-btn"><Plus size={10} className="inline" /> Wall</button>
                <button onClick={() => handleDelete(activeSchedule.id)} className="px-2 py-1 rounded text-[10px] text-white bg-red-700"><Trash2 size={10} className="inline" /></button>
              </div>
            </div>

            {/* Measurement Canvas */}
            {showMeasurements && (
              <div className="mb-3">
                <MeasurementCanvas lines={activeSchedule.measurement_lines || []} onLinesChange={handleLinesChange} />
              </div>
            )}

            {/* Instruction */}
            {!selectedItem && (
              <div className="mb-2 text-[10px] text-[#B49B7E]/40 text-center">
                Select a material from the palette above, then click a zone on the wall to place it
              </div>
            )}

            {/* Wall diagrams */}
            <div className="space-y-4">
              {activeSchedule.surfaces.map(surface => (
                <div key={surface.id} data-testid={`surface-${surface.id}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-bold text-sm">{surface.name}</span>
                    <button onClick={() => removeSurface(surface.id)} className="text-[#B49B7E]/20 hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                  <WallDiagram
                    surface={surface}
                    selectedItem={selectedItem}
                    onPlaceItem={placeItemOnZone}
                    onRemoveMaterial={removeMaterial}
                    onChangePattern={changePattern}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-[#D4C5A9]/30 text-sm mb-1">No finish schedules yet</div>
            <div className="text-[#B49B7E]/30 text-xs">Create one to start placing tiles, paint, and materials on wall diagrams</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RoomFinishSchedule;

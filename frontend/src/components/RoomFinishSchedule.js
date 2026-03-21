import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Ruler, Plus, Trash2, MousePointer, X, Pencil, ChevronRight, Layers } from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

const SCHEDULE_TYPES = [
  { value: 'tile', label: 'Tile' },
  { value: 'paint_wallpaper', label: 'Paint / Wallpaper' },
  { value: 'wood_mixed', label: 'Wood / Mixed' },
];

const TILE_PATTERNS = [
  { value: 'stacked_horizontal', label: 'STACKED HORIZONTAL' },
  { value: 'stacked_vertical', label: 'STACKED VERTICAL' },
  { value: 'offset', label: 'OFFSET (BRICK)' },
  { value: 'one_third_offset', label: '1/3 OFFSET' },
  { value: 'herringbone', label: 'HERRINGBONE' },
  { value: 'basket_weave', label: 'BASKET WEAVE' },
  { value: 'stepladder', label: 'STEPLADDER' },
  { value: 'diagonal', label: 'DIAGONAL' },
];

const LINE_COLORS = ['#FF4444', '#44AAFF', '#44FF44', '#FFAA44', '#FF44FF', '#FFFFFF'];

const getItemImage = (item) =>
  item.image_url || item.finish_image || item.image || (item.photos?.length ? item.photos[0] : '') || '';

// ─── SVG PATTERN THUMBNAILS (for the picker) ─────────────────────────
const PatternThumb = ({ pattern, size = 80 }) => {
  const s = size;
  const f = '#d6e4ed';
  const k = '#555';
  const w = 0.6;
  switch (pattern) {
    case 'stacked_horizontal':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/>{[0,10,20,30].map(y => [0,20].map(x => <rect key={`${x}${y}`} x={x+.5} y={y+.5} width={19} height={9} fill={f} stroke={k} strokeWidth={w} rx=".3"/>))}</svg>);
    case 'stacked_vertical':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/>{[0,10,20,30].map(x => [0,20].map(y => <rect key={`${x}${y}`} x={x+.5} y={y+.5} width={9} height={19} fill={f} stroke={k} strokeWidth={w} rx=".3"/>))}</svg>);
    case 'offset':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/>{[0,10,20,30].map((y,i) => [-10+(i%2)*10, 10+(i%2)*10, 30+(i%2)*10].map(x => <rect key={`${x}${y}`} x={x+.5} y={y+.5} width={19} height={9} fill={f} stroke={k} strokeWidth={w} rx=".3"/>))}</svg>);
    case 'one_third_offset':
      return (<svg width={s} height={s} viewBox="0 0 42 40"><rect width="42" height="40" fill="#e8e8e8"/>{[0,10,20,30].map((y,i) => {const o=(i%3)*7; return [-14+o,7+o,28+o].map(x=><rect key={`${x}${y}`} x={x+.5} y={y+.5} width={20} height={9} fill={f} stroke={k} strokeWidth={w} rx=".3"/>)})}</svg>);
    case 'herringbone':
      return (<svg width={s} height={s} viewBox="0 0 48 48"><rect width="48" height="48" fill="#e8e8e8"/><g strokeWidth={w} stroke={k}>{[0,24].map(bx=>[0,24].map(by=><g key={`${bx}${by}`} transform={`translate(${bx},${by})`}><rect x="2" y="0" width="5" height="22" fill={f} rx=".3" transform="rotate(45 12 12)"/><rect x="17" y="0" width="5" height="22" fill={f} rx=".3" transform="rotate(-45 12 12)"/></g>))}</g></svg>);
    case 'basket_weave':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/>{[0,20].map(y=>[0,20].map(x=><g key={`h${x}${y}`}><rect x={x+1} y={y+1} width={18} height={8} fill={f} stroke={k} strokeWidth={w} rx=".3"/><rect x={x+1} y={y+11} width={18} height={8} fill={f} stroke={k} strokeWidth={w} rx=".3"/></g>))}{[0,20].map(y=>[10,30].map(x=><g key={`v${x}${y}`}><rect x={x+1} y={y+1} width={8} height={18} fill={f} stroke={k} strokeWidth={w} rx=".3"/></g>))}</svg>);
    case 'stepladder':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/>{[0,8,16,24,32].map((x,i)=>{const o=(i%2)*10; return [-10+o,10+o,30+o].map(y=><rect key={`${x}${y}`} x={x+.5} y={y+.5} width={7} height={19} fill={f} stroke={k} strokeWidth={w} rx=".3"/>)})}</svg>);
    case 'diagonal':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/><g transform="translate(20,20) rotate(45)">{[-20,-10,0,10].map(y=>[-30,-10,10].map(x=><rect key={`${x}${y}`} x={x+.5} y={y+.5} width={19} height={9} fill={f} stroke={k} strokeWidth={w} rx=".3"/>))}</g></svg>);
    default:
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/><rect x="1" y="1" width="38" height="38" fill={f} stroke={k} strokeWidth={w}/></svg>);
  }
};

// ─── SVG GROUT LINE OVERLAY — renders the actual pattern visually ──────
// This creates an SVG that draws grout/joint lines in the tile pattern
// over the tile image, so you can CLEARLY SEE the pattern
const PatternOverlay = ({ pattern, width, height }) => {
  const grout = 'rgba(80,80,80,0.9)';
  const gw = 2; // grout width in px
  
  // Each pattern returns an SVG with a repeating tile unit
  const renderPattern = () => {
    switch (pattern) {
      case 'stacked_horizontal':
        // Horizontal rows of tiles
        return (
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id={`sh-${pattern}`} x="0" y="0" width="120" height="60" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="120" height="60" fill="none" />
                <line x1="0" y1="0" x2="120" y2="0" stroke={grout} strokeWidth={gw} />
                <line x1="60" y1="0" x2="60" y2="60" stroke={grout} strokeWidth={gw} />
                <line x1="0" y1="60" x2="120" y2="60" stroke={grout} strokeWidth={gw} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#sh-${pattern})`} />
          </svg>
        );
      case 'stacked_vertical':
        return (
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id={`sv-${pattern}`} x="0" y="0" width="60" height="120" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="120" stroke={grout} strokeWidth={gw} />
                <line x1="60" y1="0" x2="60" y2="120" stroke={grout} strokeWidth={gw} />
                <line x1="0" y1="60" x2="60" y2="60" stroke={grout} strokeWidth={gw} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#sv-${pattern})`} />
          </svg>
        );
      case 'offset':
        // Brick lay — every other row offset 50%
        return (
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id={`off-${pattern}`} x="0" y="0" width="120" height="80" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="120" y2="0" stroke={grout} strokeWidth={gw} />
                <line x1="0" y1="40" x2="120" y2="40" stroke={grout} strokeWidth={gw} />
                <line x1="0" y1="80" x2="120" y2="80" stroke={grout} strokeWidth={gw} />
                <line x1="60" y1="0" x2="60" y2="40" stroke={grout} strokeWidth={gw} />
                <line x1="0" y1="40" x2="0" y2="80" stroke={grout} strokeWidth={gw} />
                <line x1="120" y1="40" x2="120" y2="80" stroke={grout} strokeWidth={gw} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#off-${pattern})`} />
          </svg>
        );
      case 'one_third_offset':
        return (
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id={`oto-${pattern}`} x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                {[0,40,80,120].map(y => <line key={y} x1="0" y1={y} x2="120" y2={y} stroke={grout} strokeWidth={gw} />)}
                <line x1="60" y1="0" x2="60" y2="40" stroke={grout} strokeWidth={gw} />
                <line x1="100" y1="40" x2="100" y2="80" stroke={grout} strokeWidth={gw} />
                <line x1="20" y1="80" x2="20" y2="120" stroke={grout} strokeWidth={gw} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#oto-${pattern})`} />
          </svg>
        );
      case 'herringbone':
        return (
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id={`hb-${pattern}`} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                {/* V-shaped herringbone joints */}
                <line x1="0" y1="0" x2="40" y2="40" stroke={grout} strokeWidth={gw} />
                <line x1="40" y1="40" x2="0" y2="80" stroke={grout} strokeWidth={gw} />
                <line x1="40" y1="0" x2="80" y2="40" stroke={grout} strokeWidth={gw} />
                <line x1="80" y1="40" x2="40" y2="80" stroke={grout} strokeWidth={gw} />
                <line x1="0" y1="40" x2="40" y2="40" stroke={grout} strokeWidth={gw*0.5} />
                <line x1="40" y1="0" x2="40" y2="40" stroke={grout} strokeWidth={gw*0.5} />
                <line x1="40" y1="40" x2="80" y2="40" stroke={grout} strokeWidth={gw*0.5} />
                <line x1="40" y1="40" x2="40" y2="80" stroke={grout} strokeWidth={gw*0.5} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#hb-${pattern})`} />
          </svg>
        );
      case 'basket_weave':
        return (
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id={`bw-${pattern}`} x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                {/* Horizontal pair */}
                <rect x="0" y="0" width="60" height="60" fill="none" stroke={grout} strokeWidth={gw} />
                <line x1="0" y1="30" x2="60" y2="30" stroke={grout} strokeWidth={gw} />
                {/* Vertical pair */}
                <rect x="60" y="0" width="60" height="60" fill="none" stroke={grout} strokeWidth={gw} />
                <line x1="90" y1="0" x2="90" y2="60" stroke={grout} strokeWidth={gw} />
                {/* Vertical pair */}
                <rect x="0" y="60" width="60" height="60" fill="none" stroke={grout} strokeWidth={gw} />
                <line x1="30" y1="60" x2="30" y2="120" stroke={grout} strokeWidth={gw} />
                {/* Horizontal pair */}
                <rect x="60" y="60" width="60" height="60" fill="none" stroke={grout} strokeWidth={gw} />
                <line x1="60" y1="90" x2="120" y2="90" stroke={grout} strokeWidth={gw} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#bw-${pattern})`} />
          </svg>
        );
      case 'stepladder':
        return (
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id={`sl-${pattern}`} x="0" y="0" width="80" height="120" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="120" stroke={grout} strokeWidth={gw} />
                <line x1="40" y1="0" x2="40" y2="120" stroke={grout} strokeWidth={gw} />
                <line x1="80" y1="0" x2="80" y2="120" stroke={grout} strokeWidth={gw} />
                <line x1="0" y1="60" x2="40" y2="60" stroke={grout} strokeWidth={gw} />
                <line x1="40" y1="30" x2="80" y2="30" stroke={grout} strokeWidth={gw} />
                <line x1="0" y1="0" x2="40" y2="0" stroke={grout} strokeWidth={gw} />
                <line x1="40" y1="90" x2="80" y2="90" stroke={grout} strokeWidth={gw} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#sl-${pattern})`} />
          </svg>
        );
      case 'diagonal':
        return (
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id={`diag-${pattern}`} x="0" y="0" width="85" height="85" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="85" y2="0" stroke={grout} strokeWidth={gw} />
                <line x1="0" y1="0" x2="0" y2="85" stroke={grout} strokeWidth={gw} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#diag-${pattern})`} />
          </svg>
        );
      default:
        return null;
    }
  };

  return renderPattern();
};


// ─── WALL ZONE with pattern rendering ─────────────────────────────────
const WallZone = ({ zone, mat, isSelected, onClickZone, onRemove, onOpenPattern }) => {
  const hasImage = mat?.image;
  const patternLabel = mat?.pattern ? TILE_PATTERNS.find(p => p.value === mat.pattern)?.label : null;

  return (
    <div
      className={`absolute left-0 right-0 border-b border-white/20 cursor-pointer transition-all group overflow-hidden ${isSelected ? 'ring-2 ring-green-400 z-10' : ''}`}
      style={{ top: `${zone.top}%`, height: `${zone.height}%` }}
      onClick={onClickZone}
    >
      {/* Tile image as background */}
      {hasImage && (
        <div className="absolute inset-0" style={{ backgroundImage: `url(${mat.image})`, backgroundSize: '100px 100px', backgroundRepeat: 'repeat' }} />
      )}

      {/* Pattern grout line overlay — THIS is what makes the pattern visible */}
      {hasImage && mat.pattern && (
        <PatternOverlay pattern={mat.pattern} />
      )}

      {/* Empty zone background */}
      {!hasImage && (
        <div className="absolute inset-0" style={{ background: 'rgba(220,220,230,0.08)' }} />
      )}

      {/* Labels - always visible */}
      <div className={`absolute inset-0 flex items-center px-4 ${hasImage ? 'bg-black/30' : ''}`}>
        <div className="flex-1">
          {/* Zone name - big and clear */}
          <div className={`text-sm font-black uppercase tracking-wide ${hasImage ? 'text-white drop-shadow-lg' : 'text-white/20'}`}>
            {zone.label}
          </div>
          {/* Material info */}
          {mat && (
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold text-white" style={{ background: 'rgba(0,0,0,0.7)' }}>
                {mat.name} ({mat.size})
              </span>
              <span className="text-[10px] text-white/70 font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {mat.vendor}
              </span>
              {patternLabel && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black text-amber-300 flex items-center gap-1" style={{ background: 'rgba(0,0,0,0.7)' }}>
                  <span className="inline-block w-3 h-3"><PatternThumb pattern={mat.pattern} size={12} /></span>
                  {patternLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons - hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {mat && (
            <>
              <button onClick={e => { e.stopPropagation(); onOpenPattern(); }} className="px-2 py-1 rounded text-[10px] font-black text-amber-300 bg-black/70 hover:bg-black/90 border border-amber-400/30" data-testid={`pattern-btn-${zone.id}`}>
                PATTERN
              </button>
              <button onClick={e => { e.stopPropagation(); onRemove(); }} className="px-2 py-1 rounded text-[10px] text-red-300 bg-black/70 hover:bg-black/90">
                <Trash2 size={12} />
              </button>
            </>
          )}
          {!mat && isSelected && (
            <span className="px-3 py-1 rounded text-xs font-black text-green-300 animate-pulse bg-black/70">
              CLICK TO PLACE HERE
            </span>
          )}
        </div>
      </div>
    </div>
  );
};


// ─── WALL DIAGRAM ─────────────────────────────────────────────────────
const WallDiagram = ({ surface, selectedItem, onPlaceItem, onRemoveMaterial, onChangePattern }) => {
  const [patternPickerZone, setPatternPickerZone] = useState(null);

  const defaultZones = [
    { id: 'ceiling', label: 'Ceiling', top: 0, height: 8 },
    { id: 'upper_accent', label: 'Upper / Accent', top: 8, height: 18 },
    { id: 'main_wall', label: 'Main Wall', top: 26, height: 38 },
    { id: 'chair_rail', label: 'Chair Rail / Stool', top: 64, height: 7 },
    { id: 'wainscot', label: 'Wainscot / Curb', top: 71, height: 13 },
    { id: 'floor', label: 'Floor', top: 84, height: 16 },
  ];

  const zoneMap = {};
  (surface.materials || []).forEach(mat => { if (mat.position_label) zoneMap[mat.position_label] = mat; });

  return (
    <div data-testid={`wall-diagram-${surface.id}`}>
      {/* THE WALL - light background like a real elevation drawing */}
      <div className="relative w-full rounded-lg overflow-hidden" style={{ height: '420px', border: '3px solid #888', background: '#f5f5f0', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.3)' }}>
        {/* Top trim */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: '#aaa' }} />
        {/* Bottom trim */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: '#999' }} />

        {defaultZones.map(zone => {
          const mat = zoneMap[zone.id];
          return (
            <WallZone
              key={zone.id}
              zone={zone}
              mat={mat}
              isSelected={!!selectedItem}
              onClickZone={() => { if (selectedItem) onPlaceItem(surface.id, zone.id, selectedItem); }}
              onRemove={() => mat && onRemoveMaterial(surface.id, mat.id)}
              onOpenPattern={() => setPatternPickerZone(patternPickerZone === zone.id ? null : zone.id)}
            />
          );
        })}
      </div>

      {/* Pattern picker - BIG visual grid */}
      {patternPickerZone && zoneMap[patternPickerZone] && (
        <div className="mt-3 p-4 rounded-xl border-2 border-amber-400/30 shadow-2xl" style={{ background: 'rgba(0,0,0,0.97)' }} data-testid="pattern-picker">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-black text-amber-400">
              SELECT TILE PATTERN FOR: <span className="text-white">{defaultZones.find(z => z.id === patternPickerZone)?.label}</span>
            </span>
            <button onClick={() => setPatternPickerZone(null)} className="text-white/40 hover:text-white"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {TILE_PATTERNS.map(p => {
              const isActive = zoneMap[patternPickerZone]?.pattern === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => { onChangePattern(surface.id, zoneMap[patternPickerZone].id, p.value); setPatternPickerZone(null); }}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${isActive ? 'border-amber-400 bg-amber-400/10 scale-105' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                >
                  <PatternThumb pattern={p.value} size={80} />
                  <span className={`text-[10px] font-black mt-2 tracking-wider ${isActive ? 'text-amber-400' : 'text-white/60'}`}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


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
        <button onClick={() => setToolMode(toolMode === 'draw' ? 'select' : 'draw')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${toolMode === 'draw' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
          {toolMode === 'draw' ? <><Ruler size={10} /> DRAW LINE</> : <><MousePointer size={10} /> SELECT</>}
        </button>
        <div className="flex gap-0.5">{LINE_COLORS.map(c => <button key={c} onClick={() => setActiveColor(c)} className={`w-4 h-4 rounded-full border-2 ${activeColor === c ? 'border-white scale-125' : 'border-transparent'}`} style={{ background: c }} />)}</div>
        {selectedLine && <>
          <button onClick={() => { setEditingId(selectedLine); setInputVal(lines.find(l => l.id === selectedLine)?.measurement || ''); }} className="ml-auto px-2 py-1 rounded text-[10px] text-white bg-blue-600"><Pencil size={10} className="inline mr-1" />EDIT</button>
          <button onClick={() => { onLinesChange(lines.filter(l => l.id !== selectedLine)); setSelectedLine(null); }} className="px-2 py-1 rounded text-[10px] text-white bg-red-600"><Trash2 size={10} className="inline mr-1" />DELETE</button>
        </>}
      </div>
      <svg ref={svgRef} viewBox="0 0 100 60" className="w-full rounded" style={{ height: '140px', background: '#f5f5f0', border: '2px solid #aaa', cursor: toolMode === 'draw' ? 'crosshair' : 'default' }}
        onMouseDown={e => { if (toolMode !== 'draw') return; e.preventDefault(); const pt = getSvgPoint(e); setDrawing(true); setDrawStart(pt); setCurrentMouse(pt); }}
        onMouseMove={e => { if (drawing) setCurrentMouse(getSvgPoint(e)); }}
        onMouseUp={e => {
          if (!drawing || !drawStart) return;
          const end = getSvgPoint(e);
          if (Math.abs(end.x - drawStart.x) < 1 && Math.abs(end.y - drawStart.y) < 1) { setDrawing(false); setDrawStart(null); return; }
          const nl = { id: crypto.randomUUID(), start_x: drawStart.x, start_y: drawStart.y, end_x: end.x, end_y: end.y, measurement: '', color: activeColor, thickness: 2 };
          onLinesChange([...lines, nl]); setDrawing(false); setDrawStart(null); setEditingId(nl.id); setInputVal('');
        }}
        onMouseLeave={() => { if (drawing) { setDrawing(false); setDrawStart(null); } }}
      >
        <defs><pattern id="mgrid" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.1" /></pattern></defs>
        <rect width="100" height="60" fill="url(#mgrid)" />
        {lines.map(line => {
          const mx = (line.start_x + line.end_x) / 2, my = (line.start_y + line.end_y) / 2;
          const angle = Math.atan2(line.end_y - line.start_y, line.end_x - line.start_x) * 180 / Math.PI;
          const rad = angle * Math.PI / 180;
          const da = angle > 90 || angle < -90 ? angle + 180 : angle;
          return (
            <g key={line.id}>
              <line x1={line.start_x} y1={line.start_y} x2={line.end_x} y2={line.end_y} stroke={line.color} strokeWidth={0.6} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); if (toolMode === 'select') setSelectedLine(selectedLine === line.id ? null : line.id); }} />
              <line x1={line.start_x - 1.2 * Math.sin(rad)} y1={line.start_y + 1.2 * Math.cos(rad)} x2={line.start_x + 1.2 * Math.sin(rad)} y2={line.start_y - 1.2 * Math.cos(rad)} stroke={line.color} strokeWidth={0.3} />
              <line x1={line.end_x - 1.2 * Math.sin(rad)} y1={line.end_y + 1.2 * Math.cos(rad)} x2={line.end_x + 1.2 * Math.sin(rad)} y2={line.end_y - 1.2 * Math.cos(rad)} stroke={line.color} strokeWidth={0.3} />
              {line.measurement && <g transform={`translate(${mx + 1.5 * Math.sin(rad)}, ${my - 1.5 * Math.cos(rad)}) rotate(${da})`}><rect x={-line.measurement.length * 0.9} y="-2.2" width={line.measurement.length * 1.8} height="4" rx="0.5" fill="white" stroke={line.color} strokeWidth="0.2" /><text textAnchor="middle" dominantBaseline="middle" fill={line.color} fontSize="2.2" fontFamily="monospace" fontWeight="bold">{line.measurement}</text></g>}
              {selectedLine === line.id && <><circle cx={line.start_x} cy={line.start_y} r="1.2" fill={line.color} stroke="white" strokeWidth="0.3" /><circle cx={line.end_x} cy={line.end_y} r="1.2" fill={line.color} stroke="white" strokeWidth="0.3" /></>}
            </g>
          );
        })}
        {drawing && drawStart && currentMouse && <line x1={drawStart.x} y1={drawStart.y} x2={currentMouse.x} y2={currentMouse.y} stroke={activeColor} strokeWidth={0.5} strokeDasharray="1 0.5" opacity={0.7} />}
      </svg>
      {editingId && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 items-center p-3 rounded-lg shadow-xl z-30 border-2 border-red-400/40" style={{ background: '#fff' }}>
          <span className="text-xs font-bold text-gray-700">Measurement:</span>
          <input autoFocus placeholder='e.g. 72" or 8 ft' value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { onLinesChange(lines.map(l => l.id === editingId ? { ...l, measurement: inputVal } : l)); setEditingId(null); } }} className="px-3 py-1.5 rounded border-2 border-gray-300 text-gray-900 text-sm w-32 focus:outline-none focus:border-red-500" data-testid="measurement-input" />
          <button onClick={() => { onLinesChange(lines.map(l => l.id === editingId ? { ...l, measurement: inputVal } : l)); setEditingId(null); }} className="px-3 py-1.5 rounded text-xs font-bold text-white bg-green-600">OK</button>
          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded text-xs text-gray-500">Skip</button>
        </div>
      )}
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
  const [selectedItem, setSelectedItem] = useState(null);
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
            items.push({ ...item, categoryName: cat.name, _img: getItemImage(item) });
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
      return { ...s, materials: [...filtered, {
        id: crypto.randomUUID(), item_id: item.id, name: item.name || '', vendor: item.vendor || '',
        sku: item.sku || '', size: item.size || '', color: item.finish_color || item.color || '',
        image: item._img || '', link: item.link || '', position_label: zoneId, pattern: '',
      }] };
    });
    const updated = { ...activeSchedule, surfaces: updatedSurfaces };
    setActiveSchedule(updated); debouncedSave(updated);
  };

  const removeMaterial = (surfaceId, materialId) => {
    if (!activeSchedule) return;
    const updatedSurfaces = activeSchedule.surfaces.map(s =>
      s.id === surfaceId ? { ...s, materials: s.materials.filter(m => m.id !== materialId) } : s
    );
    const updated = { ...activeSchedule, surfaces: updatedSurfaces };
    setActiveSchedule(updated); debouncedSave(updated);
  };

  const changePattern = (surfaceId, materialId, pattern) => {
    if (!activeSchedule) return;
    const updatedSurfaces = activeSchedule.surfaces.map(s => {
      if (s.id !== surfaceId) return s;
      return { ...s, materials: s.materials.map(m => m.id === materialId ? { ...m, pattern } : m) };
    });
    const updated = { ...activeSchedule, surfaces: updatedSurfaces };
    setActiveSchedule(updated); debouncedSave(updated);
  };

  const addSurface = () => {
    if (!activeSchedule) return;
    const name = prompt('Wall/surface name (e.g. "Shower Niche", "Tub Surround"):');
    if (!name) return;
    const updated = { ...activeSchedule, surfaces: [...activeSchedule.surfaces, { id: crypto.randomUUID(), name, surface_type: 'wall', materials: [], measurement_lines: [] }] };
    setActiveSchedule(updated); debouncedSave(updated);
  };

  const removeSurface = (surfaceId) => {
    if (!activeSchedule || !window.confirm('Remove this wall?')) return;
    const updated = { ...activeSchedule, surfaces: activeSchedule.surfaces.filter(s => s.id !== surfaceId) };
    setActiveSchedule(updated); debouncedSave(updated);
  };

  const handleLinesChange = (newLines) => {
    const updated = { ...activeSchedule, measurement_lines: newLines };
    setActiveSchedule(updated); debouncedSave(updated);
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  const itemsWithImages = roomItems.filter(i => i._img);
  const itemsNoImages = roomItems.filter(i => !i._img);

  return (
    <div data-testid="room-finish-schedule" style={{ background: '#1a1a24' }} className="rounded-xl overflow-hidden">

      {/* ═══ MATERIAL PALETTE — always visible ═══ */}
      <div className="p-4 border-b border-white/10" style={{ background: 'linear-gradient(180deg, #222230 0%, #1a1a24 100%)' }}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-lg font-black text-white">{roomName} — Finish Schedule</h3>
            <div className="text-xs text-amber-400/80 font-bold mt-0.5">
              {selectedItem ? (
                <span className="text-green-400 animate-pulse">SELECTED: {selectedItem.name} — now click a zone on the wall to place it</span>
              ) : (
                'Step 1: Click a tile below to select it'
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {selectedItem && <button onClick={() => setSelectedItem(null)} className="px-3 py-1.5 rounded text-xs font-bold text-red-400 border border-red-400/30 hover:bg-red-400/10"><X size={12} className="inline mr-1" />DESELECT</button>}
            {onClose && <button onClick={onClose} className="px-3 py-1.5 rounded text-xs text-white/40 border border-white/10"><X size={14} /></button>}
          </div>
        </div>

        {/* Tile/Material swatches */}
        {roomItems.length === 0 ? (
          <div className="text-white/20 text-sm py-4 text-center">No items in this room — add items via Checklist or FF&E first</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {itemsWithImages.map(item => (
              <button
                key={item.id}
                data-testid={`palette-item-${item.id}`}
                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                className={`flex-shrink-0 rounded-lg overflow-hidden transition-all w-28 ${selectedItem?.id === item.id ? 'ring-3 ring-green-400 scale-105' : 'ring-1 ring-white/10 hover:ring-white/30'}`}
              >
                <img src={item._img} alt={item.name} className="w-full h-24 object-cover" />
                <div className="p-1.5" style={{ background: '#111' }}>
                  <div className="text-white text-[9px] font-black truncate">{item.name}</div>
                  <div className="text-white/40 text-[8px] truncate">{item.vendor} {item.size ? `| ${item.size}` : ''}</div>
                </div>
              </button>
            ))}
            {itemsNoImages.map(item => (
              <button
                key={item.id}
                data-testid={`palette-item-${item.id}`}
                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                className={`flex-shrink-0 rounded-lg overflow-hidden transition-all w-28 ${selectedItem?.id === item.id ? 'ring-3 ring-green-400 scale-105' : 'ring-1 ring-white/5 hover:ring-white/20'}`}
              >
                <div className="w-full h-24 bg-[#111] flex items-center justify-center"><span className="text-white/10 text-[9px] text-center px-1">{item.name}</span></div>
                <div className="p-1.5" style={{ background: '#111' }}>
                  <div className="text-white/40 text-[8px] font-bold truncate">{item.name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══ SCHEDULE CONTENT ═══ */}
      <div className="p-4">
        {/* Schedule tabs + actions */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-1 overflow-x-auto">
            {schedules.map(s => (
              <button key={s.id} onClick={() => setActiveSchedule(s)} className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap ${activeSchedule?.id === s.id ? 'bg-amber-600 text-white' : 'text-white/30 border border-white/10 hover:border-white/30'}`}>{s.name}</button>
            ))}
          </div>
          <div className="flex gap-1">
            <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 rounded text-xs font-bold text-white bg-amber-700 hover:bg-amber-600" data-testid="create-schedule-btn"><Plus size={12} className="inline mr-1" />NEW</button>
            {activeSchedule && <>
              <button onClick={() => setShowMeasurements(!showMeasurements)} className={`px-2 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 ${showMeasurements ? 'bg-red-600 text-white' : 'text-white/30 border border-white/10'}`} data-testid="toggle-measurements-btn"><Ruler size={10} />DIMENSIONS</button>
              <button onClick={addSurface} className="px-2 py-1.5 rounded text-[10px] font-bold text-white bg-blue-700" data-testid="add-surface-btn"><Plus size={10} className="inline" /> WALL</button>
              <button onClick={() => handleDelete(activeSchedule.id)} className="px-2 py-1.5 rounded text-[10px] text-red-400 border border-red-400/20"><Trash2 size={10} /></button>
            </>}
          </div>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="mb-3 p-3 rounded-lg border border-white/10" style={{ background: '#222' }}>
            <input type="text" data-testid="schedule-name-input" placeholder="Name (e.g., Primary Shower, Powder Room)" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }} className="w-full px-3 py-2 mb-2 rounded border border-white/20 bg-black text-white text-sm focus:outline-none focus:border-amber-500" />
            <div className="flex gap-2 mb-2">
              {SCHEDULE_TYPES.map(t => <button key={t.value} onClick={() => setNewType(t.value)} className={`px-3 py-1.5 rounded text-xs font-bold ${newType === t.value ? 'bg-amber-600 text-white' : 'text-white/30 border border-white/10'}`}>{t.label}</button>)}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={saving || !newName.trim()} className="px-4 py-1.5 rounded text-xs font-bold text-white bg-green-600 disabled:opacity-40">{saving ? '...' : 'CREATE'}</button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded text-xs text-white/40 border border-white/10">Cancel</button>
            </div>
          </div>
        )}

        {activeSchedule ? (
          <div>
            {/* Measurement canvas */}
            {showMeasurements && (
              <div className="mb-4">
                <MeasurementCanvas lines={activeSchedule.measurement_lines || []} onLinesChange={handleLinesChange} />
              </div>
            )}

            {!selectedItem && (
              <div className="mb-3 text-center text-white/20 text-xs font-bold">
                Step 2: Click a zone on the wall to place tile &bull; Step 3: Click PATTERN to set the tile pattern
              </div>
            )}

            {/* Wall diagrams */}
            <div className="space-y-6">
              {activeSchedule.surfaces.map(surface => (
                <div key={surface.id} data-testid={`surface-${surface.id}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-black text-base uppercase tracking-wide">{surface.name}</span>
                    <button onClick={() => removeSurface(surface.id)} className="text-white/10 hover:text-red-400"><Trash2 size={14} /></button>
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
          <div className="text-center py-12">
            <div className="text-white/20 text-lg font-bold mb-2">No finish schedules yet</div>
            <div className="text-white/10 text-sm">Click NEW to create a tile, paint, or wallpaper schedule</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RoomFinishSchedule;

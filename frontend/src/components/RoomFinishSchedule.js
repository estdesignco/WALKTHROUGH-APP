import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ruler, Plus, Trash2, MousePointer, X, Pencil, Crop, RotateCw, Palette, Square, Droplet, GripVertical, Move } from 'lucide-react';

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
  { value: 'herringbone_vertical', label: 'HERRINGBONE VERTICAL' },
  { value: 'basket_weave', label: 'BASKET WEAVE' },
  { value: 'stepladder', label: 'STEPLADDER' },
  { value: 'diagonal', label: 'DIAGONAL' },
];

const GROUT_COLORS = [
  { value: '#FFFFFF', label: 'White' },
  { value: '#D4D4D4', label: 'Light Gray' },
  { value: '#888888', label: 'Gray' },
  { value: '#4a4035', label: 'Brown' },
  { value: '#333333', label: 'Charcoal' },
  { value: '#111111', label: 'Black' },
];

const LINE_COLORS = ['#FF4444', '#44AAFF', '#44FF44', '#FFAA44', '#FF44FF', '#FFFFFF'];

const DEFAULT_ZONE_CONFIG = [
  { id: 'upper_accent', label: 'Upper', height: 25, dimension: '' },
  { id: 'main_wall', label: 'Main Wall', height: 45, dimension: '' },
  { id: 'wainscot', label: 'Wainscot', height: 15, dimension: '' },
  { id: 'floor', label: 'Floor', height: 15, dimension: '' },
];

const getItemImage = (item) =>
  item.image_url || item.finish_image || item.image || (item.photos?.length ? item.photos[0] : '') || '';

const ensureSurfaceDefaults = (s) => ({
  ...s,
  zone_config: s.zone_config || DEFAULT_ZONE_CONFIG.map(z => ({ ...z })),
  materials: s.materials || [],
  niches: s.niches || [],
  benches: s.benches || [],
  fixtures: s.fixtures || [],
  surface_type: s.surface_type || 'wall',
});

const ensureAllSurfaces = (surfaces) => {
  let result = (surfaces || []).map(ensureSurfaceDefaults);
  if (!result.find(s => s.surface_type === 'ceiling')) result.push(ensureSurfaceDefaults({ id: crypto.randomUUID(), name: 'Ceiling', surface_type: 'ceiling', materials: [] }));
  if (!result.find(s => s.surface_type === 'floor')) result.push(ensureSurfaceDefaults({ id: crypto.randomUUID(), name: 'Floor', surface_type: 'floor', materials: [] }));
  return result;
};


/* ==================== SVG PATTERN THUMBNAILS ==================== */
const PatternThumb = ({ pattern, size = 60 }) => {
  const s = size, f = '#d6e4ed', k = '#555', w = 0.6;
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
    case 'herringbone_vertical':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/><rect x="8" y="2" width="5" height="16" fill={f} stroke={k} strokeWidth={w} rx=".3"/><rect x="15" y="10" width="5" height="16" fill={f} stroke={k} strokeWidth={w} rx=".3"/><rect x="22" y="2" width="5" height="16" fill={f} stroke={k} strokeWidth={w} rx=".3"/></svg>);
    case 'basket_weave':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/>{[0,20].map(y=>[0,20].map(x=><g key={`h${x}${y}`}><rect x={x+1} y={y+1} width={18} height={8} fill={f} stroke={k} strokeWidth={w} rx=".3"/><rect x={x+1} y={y+11} width={18} height={8} fill={f} stroke={k} strokeWidth={w} rx=".3"/></g>))}</svg>);
    case 'stepladder':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/>{[0,8,16,24,32].map((x,i)=>{const o=(i%4)*5; return [-10+o,10+o,30+o].map(y=><rect key={`${x}${y}`} x={x+.5} y={y+.5} width={7} height={19} fill={f} stroke={k} strokeWidth={w} rx=".3"/>)})}</svg>);
    case 'diagonal':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/><g transform="translate(20,20) rotate(45)">{[-20,-10,0,10].map(y=>[-30,-10,10].map(x=><rect key={`${x}${y}`} x={x+.5} y={y+.5} width={19} height={9} fill={f} stroke={k} strokeWidth={w} rx=".3"/>))}</g></svg>);
    default:
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/><rect x="1" y="1" width="38" height="38" fill={f} stroke={k} strokeWidth={w}/></svg>);
  }
};


/* ==================== TILE CROP MODAL ==================== */
const TileCropModal = ({ imageUrl, existingCrop, onConfirm, onCancel }) => {
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [startPt, setStartPt] = useState(null);
  const [crop, setCrop] = useState(existingCrop || null);
  const scaleRef = useRef(1);

  useEffect(() => {
    const proxyUrl = `${API_URL}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; setImgLoaded(true); };
    img.onerror = () => { const img2 = new Image(); img2.onload = () => { imgRef.current = img2; setImgLoaded(true); }; img2.src = imageUrl; };
    img.src = proxyUrl;
  }, [imageUrl]);

  const redraw = useCallback((currentCrop) => {
    const canvas = canvasRef.current; const img = imgRef.current;
    if (!canvas || !img) return;
    const maxW = 520, maxH = 420;
    const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    scaleRef.current = s;
    canvas.width = Math.round(img.naturalWidth * s); canvas.height = Math.round(img.naturalHeight * s);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (currentCrop && currentCrop.w > 2 && currentCrop.h > 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = currentCrop.x * s, cy = currentCrop.y * s, cw = currentCrop.w * s, ch = currentCrop.h * s;
      ctx.drawImage(img, currentCrop.x, currentCrop.y, currentCrop.w, currentCrop.h, cx, cy, cw, ch);
      ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]); ctx.strokeRect(cx, cy, cw, ch); ctx.setLineDash([]);
      const preview = previewCanvasRef.current;
      if (preview) {
        const pSize = 120; const aspect = currentCrop.w / currentCrop.h;
        preview.width = aspect >= 1 ? pSize : Math.round(pSize * aspect);
        preview.height = aspect >= 1 ? Math.round(pSize / aspect) : pSize;
        preview.getContext('2d').drawImage(img, currentCrop.x, currentCrop.y, currentCrop.w, currentCrop.h, 0, 0, preview.width, preview.height);
      }
    }
  }, []);

  useEffect(() => { if (imgLoaded) redraw(crop); }, [imgLoaded, crop, redraw]);

  const getImageCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect(); const s = scaleRef.current;
    return { x: (e.clientX - rect.left) / s, y: (e.clientY - rect.top) / s };
  };

  const validCrop = crop && crop.w > 10 && crop.h > 10;

  const handleUseFullImage = () => {
    const img = imgRef.current;
    if (img) onConfirm({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight });
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.88)' }} data-testid="tile-crop-modal">
      <div className="rounded-xl p-6 max-w-[720px] w-full mx-4" style={{ background: '#1c1c2a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-white font-black text-lg mb-1">EXTRACT SINGLE TILE</h3>
        <p className="text-white/50 text-sm mb-4">Draw a rectangle around <span className="text-green-400 font-bold">ONE individual tile</span>, or use the full image.</p>
        <div className="flex gap-5 items-start">
          <div className="flex-1 overflow-auto rounded border border-white/10" style={{ background: '#111' }}>
            {!imgLoaded ? <div className="flex items-center justify-center h-48 text-white/30 text-sm">Loading...</div> : (
              <canvas ref={canvasRef} className="cursor-crosshair block mx-auto"
                onMouseDown={e => { e.preventDefault(); setDragging(true); setStartPt(getImageCoords(e)); setCrop(null); }}
                onMouseMove={e => { if (!dragging || !startPt) return; const pt = getImageCoords(e); setCrop({ x: Math.round(Math.min(startPt.x, pt.x)), y: Math.round(Math.min(startPt.y, pt.y)), w: Math.round(Math.abs(pt.x - startPt.x)), h: Math.round(Math.abs(pt.y - startPt.y)) }); }}
                onMouseUp={() => setDragging(false)} onMouseLeave={() => { if (dragging) setDragging(false); }} />
            )}
          </div>
          {validCrop && (
            <div className="w-40 flex-shrink-0">
              <div className="text-[10px] font-black text-green-400 mb-2 tracking-wider">EXTRACTED TILE:</div>
              <div className="rounded border-2 border-green-400/50 overflow-hidden" style={{ background: '#fff' }}><canvas ref={previewCanvasRef} className="block mx-auto" /></div>
              <div className="text-[9px] text-white/30 mt-1.5">{crop.w} x {crop.h} px</div>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-5 flex-wrap">
          <button disabled={!validCrop} onClick={() => onConfirm(crop)} className="px-6 py-2.5 rounded-lg text-sm font-black text-black bg-green-400 hover:bg-green-300 disabled:opacity-30 disabled:cursor-not-allowed" data-testid="crop-confirm-btn">USE THIS TILE</button>
          <button onClick={handleUseFullImage} disabled={!imgLoaded}
            className="px-6 py-2.5 rounded-lg text-sm font-black text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed" data-testid="use-full-image-btn">
            USE FULL IMAGE
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 rounded-lg text-sm text-white/50 border border-white/20 hover:border-white/40" data-testid="crop-cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};


/* ==================== CANVAS TILE PATTERN RENDERER ==================== */
const drawTilePattern = (ctx, tileImg, pattern, w, h, groutColor, orientation, tileScale) => {
  const grout = 3;
  ctx.fillStyle = groutColor || '#4a4035';
  ctx.fillRect(0, 0, w, h);
  const imgW = tileImg.width || tileImg.naturalWidth || 200;
  const imgH = tileImg.height || tileImg.naturalHeight || 200;
  const scale = tileScale || 1.0;

  const drawTile = (x, y, tw, th) => {
    if (x + tw < 0 || x > w || y + th < 0 || y > h) return;
    ctx.drawImage(tileImg, 0, 0, imgW, imgH, x, y, tw, th);
    const hash = Math.abs(((x * 7919 + y * 104729) | 0) % 10000);
    const bright = ((hash % 7) - 3) * 0.012;
    if (bright !== 0) { ctx.fillStyle = bright > 0 ? `rgba(255,255,255,${bright})` : `rgba(0,0,0,${-bright})`; ctx.fillRect(x, y, tw, th); }
    const bev = Math.max(1, Math.min(tw, th) * 0.025);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x, y, tw, bev); ctx.fillRect(x, y, bev, th);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x, y + th - bev, tw, bev); ctx.fillRect(x + tw - bev, y, bev, th);
  };

  // Use the SMALLER dimension so tiles stay proportional on narrow side walls
  const refDim = Math.min(w, h);
  let tl = Math.max(8, Math.min(80, refDim * 0.07 * scale));
  let ts = Math.max(4, Math.round(tl / 3.5));
  if (orientation === 'vertical') { const tmp = tl; tl = ts; ts = tmp; }
  const g = grout;

  switch (pattern) {
    case 'stacked_horizontal':
      for (let y = -ts; y < h + ts * 2; y += ts + g) for (let x = -tl; x < w + tl * 2; x += tl + g) drawTile(x, y, tl, ts);
      break;
    case 'stacked_vertical':
      for (let x = -ts; x < w + ts * 2; x += ts + g) for (let y = -tl; y < h + tl * 2; y += tl + g) drawTile(x, y, ts, tl);
      break;
    case 'offset': {
      let row = 0;
      for (let y = -ts; y < h + ts * 2; y += ts + g, row++) { const off = (row % 2) * ((tl + g) / 2); for (let x = -tl * 2; x < w + tl * 2; x += tl + g) drawTile(x + off, y, tl, ts); }
      break;
    }
    case 'one_third_offset': {
      let row = 0;
      for (let y = -ts; y < h + ts * 2; y += ts + g, row++) { const off = (row % 3) * ((tl + g) / 3); for (let x = -tl * 2; x < w + tl * 2; x += tl + g) drawTile(x + off, y, tl, ts); }
      break;
    }
    case 'herringbone': {
      const tw = Math.max(15, ts); const th = Math.max(35, tl);
      for (let row = -2; row < Math.ceil(h / (tw + g)) + 4; row++) {
        for (let col = -2; col < Math.ceil(w / (th + g)) + 4; col++) {
          const bx = col * (th + g); const by = row * (tw * 2 + g * 2);
          drawTile(bx, by + (col % 2) * (tw + g), th, tw);
          drawTile(bx + th - tw, by + (col % 2) * (tw + g) + tw + g, tw, th);
        }
      }
      break;
    }
    case 'herringbone_vertical': {
      const tw = Math.max(12, ts); const th = Math.max(35, tl);
      for (let col = -4; col < Math.ceil(w / (tw + g)) + 4; col++) {
        for (let row = -4; row < Math.ceil(h / (th / 2 + g)) + 4; row++) {
          const x = col * (tw * 2 + g); const y = row * (th / 2 + g);
          if (row % 2 === 0) { drawTile(x, y, tw, th); drawTile(x + tw + g, y + th / 2, tw, th); }
          else { drawTile(x + tw + g, y, tw, th); drawTile(x, y + th / 2, tw, th); }
        }
      }
      break;
    }
    case 'basket_weave': {
      const block = ts * 2 + g; const cell = block + g;
      for (let gy = -2; gy < Math.ceil(h / cell) + 2; gy++) for (let gx = -2; gx < Math.ceil(w / cell) + 2; gx++) {
        const bx = gx * cell, by = gy * cell;
        if ((gx + gy) % 2 === 0) { drawTile(bx, by, block, ts); drawTile(bx, by + ts + g, block, ts); }
        else { drawTile(bx, by, ts, block); drawTile(bx + ts + g, by, ts, block); }
      }
      break;
    }
    case 'stepladder': {
      let col = 0;
      for (let x = -ts; x < w + ts * 2; x += ts + g, col++) { const off = ((col % 4) * ((tl + g) / 4)); for (let y = -tl * 2 + off; y < h + tl * 2; y += tl + g) drawTile(x, y, ts, tl); }
      break;
    }
    case 'diagonal': {
      const sq = Math.max(8, Math.min(80, refDim * 0.07 * scale)); const step = sq + g;
      ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(Math.PI / 4);
      const range = Math.max(w, h) * 1.5;
      for (let y = -range; y < range; y += step) for (let x = -range; x < range; x += step) drawTile(x, y, sq, sq);
      ctx.restore(); break;
    }
    default: ctx.drawImage(tileImg, 0, 0, w, h);
  }
};


/* ==================== TILE PATTERN CANVAS ==================== */
const TilePatternCanvas = ({ pattern, imageUrl, tileCrop, groutColor, tileOrientation, tileScale }) => {
  const containerRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const imgRef = React.useRef(null);

  const draw = React.useCallback(() => {
    const container = containerRef.current; const canvas = canvasRef.current; const img = imgRef.current;
    if (!container || !canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const rect = container.getBoundingClientRect();
    const w = Math.round(rect.width); const h = Math.round(rect.height);
    if (w < 10 || h < 10) return;
    canvas.width = w; canvas.height = h;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    const crop = (tileCrop && tileCrop.w > 0 && tileCrop.h > 0) ? tileCrop
      : { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = Math.max(1, Math.round(crop.w)); tileCanvas.height = Math.max(1, Math.round(crop.h));
    tileCanvas.getContext('2d').drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, tileCanvas.width, tileCanvas.height);
    drawTilePattern(ctx, tileCanvas, pattern, w, h, groutColor, tileOrientation, tileScale);
  }, [pattern, tileCrop, groutColor, tileOrientation, tileScale]);

  React.useEffect(() => {
    if (!imageUrl) return;
    const proxyUrl = `${API_URL}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; draw(); };
    img.onerror = () => { const img2 = new Image(); img2.onload = () => { imgRef.current = img2; draw(); }; img2.src = imageUrl; };
    img.src = proxyUrl;
    return () => { img.onload = null; img.onerror = null; };
  }, [imageUrl, draw]);

  React.useEffect(() => { draw(); }, [draw]);
  React.useEffect(() => {
    const container = containerRef.current; if (!container) return;
    const ro = new ResizeObserver(() => draw()); ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, display: 'block' }} />
    </div>
  );
};


/* ==================== NICHE / BENCH / FIXTURE OVERLAYS ==================== */
const NicheOverlay = ({ niche, isSelected, onClick, onDragStart, selectedItem, onApplyTile }) => (
  <div
    data-testid={`niche-${niche.id}`}
    className={`absolute cursor-grab active:cursor-grabbing transition-shadow ${isSelected ? 'ring-2 ring-cyan-400 z-20' : 'z-10 hover:ring-1 hover:ring-cyan-300/50'}`}
    style={{
      left: `${niche.x}%`, top: `${niche.y}%`, width: `${niche.w}%`, height: `${niche.h}%`,
      boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5), inset 0 -1px 4px rgba(0,0,0,0.2)',
      border: niche.trim === 'schluter' ? '3px solid #c0c0c0' : niche.trim === 'bullnose' ? '3px solid #e8e0d4' : niche.trim === 'pencil' ? '2px solid #8b7355' : '1px solid rgba(0,0,0,0.4)',
      background: '#c8c4bc', borderRadius: '2px',
    }}
    onMouseDown={e => {
      e.stopPropagation(); e.preventDefault();
      if (selectedItem) { onApplyTile(); }
      else { onDragStart(e, 'niche', niche); }
    }}>
    {niche.material?.image && niche.material?.pattern && (
      <TilePatternCanvas pattern={niche.material.pattern} imageUrl={niche.material.image}
        tileCrop={niche.material.tile_crop} groutColor={niche.material.grout_color}
        tileOrientation={niche.material.tile_orientation} tileScale={niche.material.tile_scale} />
    )}
    <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[7px] font-black text-white/80 bg-black/60 text-center pointer-events-none">NICHE</div>
    {isSelected && <>
      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-cyan-400 border border-white rounded-full cursor-nw-resize z-30"
        onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onDragStart(e, 'niche-resize-tl', niche); }} />
      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 border border-white rounded-full cursor-ne-resize z-30"
        onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onDragStart(e, 'niche-resize-tr', niche); }} />
      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-cyan-400 border border-white rounded-full cursor-sw-resize z-30"
        onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onDragStart(e, 'niche-resize-bl', niche); }} />
      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-cyan-400 border border-white rounded-full cursor-se-resize z-30"
        onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onDragStart(e, 'niche-resize-br', niche); }} />
    </>}
  </div>
);

const BenchOverlay = ({ bench, isSelected, onClick, onDragStart, selectedItem, onApplyTile }) => (
  <div
    data-testid={`bench-${bench.id}`}
    className={`absolute cursor-grab active:cursor-grabbing transition-shadow ${isSelected ? 'ring-2 ring-orange-400 z-20' : 'z-10 hover:ring-1 hover:ring-orange-300/50'}`}
    style={{
      left: `${bench.x}%`, top: `${bench.y}%`, width: `${bench.w}%`, height: `${bench.h}%`,
      boxShadow: '0 3px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
      border: bench.trim === 'schluter' ? '3px solid #c0c0c0' : bench.trim === 'bullnose' ? '3px solid #e8e0d4' : bench.trim === 'pencil' ? '2px solid #8b7355' : '1px solid rgba(0,0,0,0.3)',
      background: '#ddd8d0', borderRadius: '2px',
    }}
    onMouseDown={e => {
      e.stopPropagation(); e.preventDefault();
      if (selectedItem) { onApplyTile(); }
      else { onDragStart(e, 'bench', bench); }
    }}>
    {bench.material?.image && bench.material?.pattern && (
      <TilePatternCanvas pattern={bench.material.pattern} imageUrl={bench.material.image}
        tileCrop={bench.material.tile_crop} groutColor={bench.material.grout_color}
        tileOrientation={bench.material.tile_orientation} tileScale={bench.material.tile_scale} />
    )}
    <div className="absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
    <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[7px] font-black text-white/80 bg-black/60 text-center pointer-events-none">BENCH</div>
    {isSelected && <>
      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-orange-400 border border-white rounded-full cursor-nw-resize z-30"
        onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onDragStart(e, 'bench-resize-tl', bench); }} />
      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 border border-white rounded-full cursor-ne-resize z-30"
        onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onDragStart(e, 'bench-resize-tr', bench); }} />
      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-orange-400 border border-white rounded-full cursor-sw-resize z-30"
        onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onDragStart(e, 'bench-resize-bl', bench); }} />
      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-orange-400 border border-white rounded-full cursor-se-resize z-30"
        onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onDragStart(e, 'bench-resize-br', bench); }} />
    </>}
  </div>
);

const FixtureOverlay = ({ fixture, isSelected, onClick, onDragStart }) => (
  <div
    data-testid={`fixture-${fixture.id}`}
    className={`absolute cursor-grab active:cursor-grabbing z-10 ${isSelected ? 'ring-2 ring-blue-400 scale-110' : 'hover:scale-105'}`}
    style={{
      left: `${fixture.x}%`, top: `${fixture.y}%`, transform: 'translate(-50%, -50%)',
      width: '36px', height: '36px', borderRadius: '50%',
      background: 'rgba(20,20,30,0.85)', border: '2px solid rgba(100,160,255,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s',
    }}
    onMouseDown={e => { e.stopPropagation(); e.preventDefault(); onDragStart(e, 'fixture', fixture); }}>
    {fixture.image ? <img src={fixture.image} alt="" className="w-5 h-5 rounded-full object-cover pointer-events-none" /> : <Droplet size={14} className="text-blue-400 pointer-events-none" />}
    <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-1 py-0 rounded text-[6px] font-black text-white bg-black/80 whitespace-nowrap pointer-events-none">{fixture.name || 'Fixture'}</div>
  </div>
);


/* ==================== WALL ZONE ==================== */
const WallZone = ({ zone, zoneHeight, mat, compact, niches, benches, fixtures,
  surfaceId, onClickZone, onRemove, onOpenPattern, onCropTile, selectedElement, onDragStart,
  selectedItem, onApplyTileToElement }) => {
  const zoneRef = useRef(null);
  const hasImage = mat?.image;
  const hasCrop = mat?.tile_crop && mat.tile_crop.w > 0;
  const patternLabel = mat?.pattern ? TILE_PATTERNS.find(p => p.value === mat.pattern)?.label : null;

  const wrappedDragStart = useCallback((e, type, el) => {
    const rect = zoneRef.current?.getBoundingClientRect();
    if (rect && surfaceId) onDragStart(e, type, el, surfaceId, rect);
  }, [surfaceId, onDragStart]);

  const wrappedApplyTile = useCallback((elementType, elementId) => {
    if (surfaceId && selectedItem) onApplyTileToElement(surfaceId, elementType, elementId, selectedItem);
  }, [surfaceId, selectedItem, onApplyTileToElement]);

  return (
    <div
      ref={zoneRef}
      className="absolute left-0 right-0 cursor-pointer transition-all group overflow-hidden"
      style={{ top: `${zone.top}%`, height: `${zoneHeight}%` }}
      onClick={onClickZone}
      data-testid={`wall-zone-${zone.id}`}
    >
      {hasImage ? (
        <TilePatternCanvas key={`${mat.pattern || 'sh'}-${mat.id}-${hasCrop ? 'c' : 'r'}-${mat.grout_color}-${mat.tile_orientation}-${mat.tile_scale}`}
          pattern={mat.pattern || 'stacked_horizontal'} imageUrl={mat.image} tileCrop={mat.tile_crop}
          groutColor={mat.grout_color} tileOrientation={mat.tile_orientation} tileScale={mat.tile_scale} />
      ) : (
        <div className="absolute inset-0" style={{ background: '#f5f5f0', borderBottom: '1px solid #ddd' }}>
          <div className="absolute inset-0 flex items-center justify-center"><span className="text-amber-600/30 text-[8px] font-bold">CLICK TO PLACE</span></div>
        </div>
      )}
      {/* Niches */}
      {(niches || []).map(n => <NicheOverlay key={n.id} niche={n}
        isSelected={selectedElement?.id === n.id} onDragStart={wrappedDragStart}
        selectedItem={selectedItem} onApplyTile={() => wrappedApplyTile('niche', n.id)} />)}
      {/* Benches */}
      {(benches || []).map(b => <BenchOverlay key={b.id} bench={b}
        isSelected={selectedElement?.id === b.id} onDragStart={wrappedDragStart}
        selectedItem={selectedItem} onApplyTile={() => wrappedApplyTile('bench', b.id)} />)}
      {/* Fixtures */}
      {(fixtures || []).map(f => <FixtureOverlay key={f.id} fixture={f}
        isSelected={selectedElement?.id === f.id} onDragStart={wrappedDragStart} />)}
      {/* Zone info bar */}
      <div className={`absolute bottom-0 left-0 right-0 flex items-center justify-between px-1.5 ${compact ? 'py-0' : 'py-0.5'}`}
        style={hasImage ? { background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' } : { borderTop: '1px solid #ddd' }}>
        <div className="flex items-center gap-1 flex-wrap min-w-0">
          <span className={`text-[${compact ? '7' : '9'}px] font-black uppercase tracking-wider ${hasImage ? 'text-white' : 'text-gray-400'}`}>{zone.label}</span>
          {zone.dimension && <span className="text-[8px] font-mono text-amber-300/80 bg-black/40 px-1 rounded">{zone.dimension}</span>}
          {patternLabel && !compact && <span className="px-1 rounded text-[7px] font-black text-amber-300 bg-black/60">{patternLabel}</span>}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {mat && <>
            <button onClick={e => { e.stopPropagation(); onCropTile(); }} className={`px-1 py-0.5 rounded text-[8px] font-black flex items-center gap-0.5 ${hasCrop ? 'text-green-300 bg-black/80' : 'text-orange-300 bg-black/80 animate-pulse'}`} data-testid={`crop-btn-${zone.id}`}><Crop size={8} />CROP</button>
            <button onClick={e => { e.stopPropagation(); onOpenPattern(); }} className="px-1 py-0.5 rounded text-[8px] font-black text-amber-300 bg-black/80" data-testid={`pattern-btn-${zone.id}`}>PATTERN</button>
            <button onClick={e => { e.stopPropagation(); onRemove(); }} className="px-0.5 py-0.5 rounded text-[8px] text-red-300 bg-black/80"><Trash2 size={8} /></button>
          </>}
        </div>
      </div>
    </div>
  );
};


/* ==================== 3D SHOWER PERSPECTIVE VIEW ==================== */
const Shower3DView = ({ schedule, selectedItem, placementMode, selectedElement,
  onPlaceItem, onPlaceFixture, onAddNiche, onAddBench, onRemoveMaterial,
  onChangePattern, onCropTile, onChangeGrout, onChangeOrientation, onChangeTileScale,
  onSelectElement, onDeleteElement, onUpdateElement, onApplyTileToElement,
  onResizeZone, onEditDimension, onPlaceCeilingFloor }) => {

  const [patternPicker, setPatternPicker] = useState(null);
  const [editingDim, setEditingDim] = useState(null);
  const [dimValue, setDimValue] = useState('');
  const dragRef = useRef(null);
  const callbacksRef = useRef({});
  callbacksRef.current = { onUpdateElement, onResizeZone, onSelectElement };

  // Global drag handlers for element move/resize and zone resize
  useEffect(() => {
    const handleMove = (e) => {
      if (!dragRef.current) return;
      const d = dragRef.current;
      const dx = e.clientX - d.startMouseX;
      const dy = e.clientY - d.startMouseY;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      d.moved = true;

      if (d.dragType === 'zone-resize') {
        const deltaPct = (dy / d.wallHeight) * 100;
        const newConfig = d.startConfig.map(z => ({ ...z }));
        const total = newConfig[d.zoneIdx].height + newConfig[d.zoneIdx + 1].height;
        const newH = Math.max(5, Math.min(total - 5, d.startConfig[d.zoneIdx].height + deltaPct));
        newConfig[d.zoneIdx] = { ...newConfig[d.zoneIdx], height: newH };
        newConfig[d.zoneIdx + 1] = { ...newConfig[d.zoneIdx + 1], height: total - newH };
        callbacksRef.current.onResizeZone(d.surfaceId, newConfig);
      } else if (d.dragType.startsWith('niche') || d.dragType.startsWith('bench') || d.dragType === 'fixture') {
        const rect = d.zoneRect;
        if (d.dragType === 'niche' || d.dragType === 'fixture') {
          const newX = Math.max(0, Math.min(95, ((e.clientX - rect.left - d.offsetX) / rect.width) * 100));
          const newY = Math.max(0, Math.min(95, ((e.clientY - rect.top - d.offsetY) / rect.height) * 100));
          const elType = d.dragType === 'fixture' ? 'fixture' : d.dragType;
          callbacksRef.current.onUpdateElement(d.surfaceId, elType, d.elementId, { x: Math.round(newX), y: Math.round(newY) });
        } else if (d.dragType === 'bench') {
          // Bench only moves horizontally — stays at bottom
          const newX = Math.max(0, Math.min(95, ((e.clientX - rect.left - d.offsetX) / rect.width) * 100));
          callbacksRef.current.onUpdateElement(d.surfaceId, 'bench', d.elementId, { x: Math.round(newX) });
        } else if (d.dragType.includes('resize')) {
          // Resize handles (tl, tr, bl, br)
          const corner = d.dragType.split('-').pop(); // tl, tr, bl, br
          const elType = d.dragType.startsWith('niche') ? 'niche' : 'bench';
          const pxToW = (1 / rect.width) * 100;
          const pxToH = (1 / rect.height) * 100;
          let { x, y, w, h } = d.startProps;
          if (elType === 'bench') {
            // Bench resize: only adjust width and height (bottom stays anchored)
            if (corner === 'tl') { x = Math.max(0, d.startProps.x + dx * pxToW); w = Math.max(10, d.startProps.w - dx * pxToW); h = Math.max(5, d.startProps.h - dy * pxToH); }
            else if (corner === 'tr') { w = Math.max(10, d.startProps.w + dx * pxToW); h = Math.max(5, d.startProps.h - dy * pxToH); }
            else if (corner === 'bl') { x = Math.max(0, d.startProps.x + dx * pxToW); w = Math.max(10, d.startProps.w - dx * pxToW); }
            else if (corner === 'br') { w = Math.max(10, d.startProps.w + dx * pxToW); }
          } else {
            if (corner === 'br') { w = Math.max(10, d.startProps.w + dx * pxToW); h = Math.max(10, d.startProps.h + dy * pxToH); }
            else if (corner === 'bl') { x = Math.max(0, d.startProps.x + dx * pxToW); w = Math.max(10, d.startProps.w - dx * pxToW); h = Math.max(10, d.startProps.h + dy * pxToH); }
            else if (corner === 'tr') { y = d.startProps.y; w = Math.max(10, d.startProps.w + dx * pxToW); y = Math.max(0, d.startProps.y + dy * pxToH); h = Math.max(10, d.startProps.h - dy * pxToH); }
            else if (corner === 'tl') { x = Math.max(0, d.startProps.x + dx * pxToW); y = Math.max(0, d.startProps.y + dy * pxToH); w = Math.max(10, d.startProps.w - dx * pxToW); h = Math.max(10, d.startProps.h - dy * pxToH); }
          }
          callbacksRef.current.onUpdateElement(d.surfaceId, elType, d.elementId, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
        }
      }
    };

    const handleUp = () => {
      if (dragRef.current && !dragRef.current.moved) {
        // Was a click, not a drag — select the element
        const d = dragRef.current;
        if (d.elementId) callbacksRef.current.onSelectElement({ type: d.elementBaseType, id: d.elementId });
      }
      dragRef.current = null;
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => { document.removeEventListener('mousemove', handleMove); document.removeEventListener('mouseup', handleUp); };
  }, []);

  const surfaces = schedule.surfaces || [];
  const walls = surfaces.filter(s => s.surface_type === 'wall');
  const ceiling = surfaces.find(s => s.surface_type === 'ceiling');
  const floor = surfaces.find(s => s.surface_type === 'floor');

  const backWall = walls.find(s => s.name?.toLowerCase().includes('back')) || walls[0];
  const leftWall = walls.find(s => s.name?.toLowerCase().includes('left')) || walls[1];
  const rightWall = walls.find(s => s.name?.toLowerCase().includes('right')) || walls[2];

  const getZoneMap = (surface) => {
    const map = {};
    (surface?.materials || []).forEach(mat => { if (mat.position_label) map[mat.position_label] = mat; });
    return map;
  };

  const getZoneConfig = (surface) => surface?.zone_config || DEFAULT_ZONE_CONFIG.map(z => ({ ...z }));

  const handleZoneClick = (surface, zoneId, e) => {
    if (!surface) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    if (placementMode === 'niche') onAddNiche(surface.id, zoneId, xPct, yPct);
    else if (placementMode === 'bench') onAddBench(surface.id, zoneId, xPct, yPct);
    else if (placementMode === 'fixture' && selectedItem) onPlaceFixture(surface.id, zoneId, selectedItem, xPct, yPct);
    else if (selectedItem) onPlaceItem(surface.id, zoneId, selectedItem);
  };

  const handleCeilingFloorClick = (surface) => {
    if (!surface || !selectedItem) return;
    if (placementMode === 'fixture') onPlaceFixture(surface.id, '_surface', selectedItem, 50, 50);
    else onPlaceCeilingFloor(surface.id, selectedItem);
  };

  // Element drag start handler — passed to all overlays
  const handleElementDragStart = (e, dragType, element, providedSurfaceId, providedRect) => {
    const zoneRect = providedRect || (e.target.closest('[data-testid^="wall-zone-"]') || e.target.closest('[data-testid^="surface-"]'))?.getBoundingClientRect();
    if (!zoneRect) return;
    let surfaceId = providedSurfaceId || null;
    let elementBaseType = dragType.replace(/-resize-.+$/, '');
    if (!surfaceId) {
      for (const s of surfaces) {
        if (elementBaseType === 'niche' && (s.niches || []).find(n => n.id === element.id)) { surfaceId = s.id; break; }
        if (elementBaseType === 'bench' && (s.benches || []).find(b => b.id === element.id)) { surfaceId = s.id; break; }
        if (elementBaseType === 'fixture' && (s.fixtures || []).find(f => f.id === element.id)) { surfaceId = s.id; break; }
      }
    }
    if (!surfaceId) return;

    dragRef.current = {
      dragType, surfaceId, elementId: element.id, elementBaseType,
      zoneRect, startMouseX: e.clientX, startMouseY: e.clientY, moved: false,
      offsetX: e.clientX - zoneRect.left - (element.x / 100) * zoneRect.width,
      offsetY: e.clientY - zoneRect.top - (element.y / 100) * zoneRect.height,
      startProps: { x: element.x, y: element.y, w: element.w, h: element.h },
    };
  };

  // Zone resize start handler
  const handleZoneResizeStart = (e, surface, zoneIdx) => {
    e.preventDefault(); e.stopPropagation();
    const wallEl = e.currentTarget.parentElement;
    if (!wallEl) return;
    const wallRect = wallEl.getBoundingClientRect();
    const zones = getZoneConfig(surface);
    dragRef.current = {
      dragType: 'zone-resize', surfaceId: surface.id, zoneIdx,
      startMouseX: e.clientX, startMouseY: e.clientY, moved: false,
      wallHeight: wallRect.height, startConfig: zones.map(z => ({ ...z })),
    };
  };

  const renderWallFace = (surface, compact) => {
    if (!surface) return <div className="absolute inset-0" style={{ background: '#f0ede8' }} />;
    const zoneMap = getZoneMap(surface);
    const zones = getZoneConfig(surface);
    let accTop = 0;
    const elements = [];
    zones.forEach((zone, idx) => {
      const top = accTop;
      accTop += zone.height;
      const mat = zoneMap[zone.id];
      const zoneNiches = (surface.niches || []).filter(n => n.zone_id === zone.id);
      const zoneFixtures = (surface.fixtures || []).filter(f => f.zone_id === zone.id);
      // Benches are rendered at wall level (below), NOT inside zones
      elements.push(
        <WallZone key={zone.id} zone={{ ...zone, top }} zoneHeight={zone.height} mat={mat}
          compact={compact} surfaceId={surface.id}
          niches={zoneNiches} benches={[]} fixtures={zoneFixtures}
          selectedElement={selectedElement}
          selectedItem={selectedItem}
          onDragStart={handleElementDragStart}
          onApplyTileToElement={onApplyTileToElement}
          onClickZone={(e) => handleZoneClick(surface, zone.id, e)}
          onRemove={() => mat && onRemoveMaterial(surface.id, mat.id)}
          onOpenPattern={() => setPatternPicker(patternPicker?.zoneId === zone.id && patternPicker?.surfaceId === surface.id ? null : { surfaceId: surface.id, zoneId: zone.id })}
          onCropTile={() => mat && onCropTile(surface.id, mat.id, mat.image, mat.tile_crop)}
        />
      );
      // Zone resize handle between zones (only on non-compact walls)
      if (!compact && idx < zones.length - 1) {
        elements.push(
          <div key={`resize-${idx}`}
            className="absolute left-0 right-0 z-30 cursor-row-resize group/rz"
            style={{ top: `${accTop}%`, height: '10px', transform: 'translateY(-5px)' }}
            onMouseDown={(e) => handleZoneResizeStart(e, surface, idx)}
            data-testid={`zone-handle-${idx}`}>
            <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-[3px] rounded bg-transparent group-hover/rz:bg-amber-400/70 transition-all" />
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-6 h-3 rounded bg-transparent group-hover/rz:bg-amber-400 flex items-center justify-center opacity-0 group-hover/rz:opacity-100 transition-all">
              <GripVertical size={8} className="text-black rotate-90" />
            </div>
          </div>
        );
      }
    });
    // Render ALL benches at the wall level, anchored to the bottom
    const wallBenches = surface.benches || [];
    wallBenches.forEach(bench => {
      const benchRef = React.createRef();
      elements.push(
        <div key={`bench-${bench.id}`}
          ref={benchRef}
          data-testid={`bench-${bench.id}`}
          className={`absolute cursor-grab active:cursor-grabbing z-20 transition-shadow ${selectedElement?.id === bench.id ? 'ring-2 ring-orange-400' : 'hover:ring-1 hover:ring-orange-300/50'}`}
          style={{
            left: `${bench.x}%`, bottom: '0%',
            width: `${bench.w}%`, height: `${bench.h}%`,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            border: bench.trim === 'schluter' ? '3px solid #c0c0c0' : bench.trim === 'bullnose' ? '3px solid #e8e0d4' : bench.trim === 'pencil' ? '2px solid #8b7355' : '2px solid rgba(100,80,60,0.5)',
            background: '#ddd8d0', borderRadius: '2px 2px 0 0',
          }}
          onMouseDown={e => {
            e.stopPropagation(); e.preventDefault();
            if (selectedItem) {
              if (surface.id && onApplyTileToElement) onApplyTileToElement(surface.id, 'bench', bench.id, selectedItem);
            } else {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) handleElementDragStart(e, 'bench', bench, surface.id, rect);
            }
          }}>
          {bench.material?.image && bench.material?.pattern && (
            <TilePatternCanvas pattern={bench.material.pattern} imageUrl={bench.material.image}
              tileCrop={bench.material.tile_crop} groutColor={bench.material.grout_color}
              tileOrientation={bench.material.tile_orientation} tileScale={(bench.material.tile_scale || 1) * 0.5} />
          )}
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[7px] font-black text-white/80 bg-black/60 text-center pointer-events-none">
            BENCH {bench.width_inches ? `${bench.width_inches} × ${bench.height_inches || ''}` : ''}
          </div>
          {selectedElement?.id === bench.id && <>
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-orange-400 border border-white rounded-full cursor-nw-resize z-30"
              onMouseDown={e => { e.stopPropagation(); e.preventDefault(); const rect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect(); if (rect) handleElementDragStart(e, 'bench-resize-tl', bench, surface.id, rect); }} />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 border border-white rounded-full cursor-ne-resize z-30"
              onMouseDown={e => { e.stopPropagation(); e.preventDefault(); const rect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect(); if (rect) handleElementDragStart(e, 'bench-resize-tr', bench, surface.id, rect); }} />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-orange-400 border border-white rounded-full cursor-sw-resize z-30"
              onMouseDown={e => { e.stopPropagation(); e.preventDefault(); const rect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect(); if (rect) handleElementDragStart(e, 'bench-resize-bl', bench, surface.id, rect); }} />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-orange-400 border border-white rounded-full cursor-se-resize z-30"
              onMouseDown={e => { e.stopPropagation(); e.preventDefault(); const rect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect(); if (rect) handleElementDragStart(e, 'bench-resize-br', bench, surface.id, rect); }} />
          </>}
        </div>
      );
    });
    return elements;
  };

  const renderSimpleSurface = (surface, label) => {
    if (!surface) return null;
    const mat = (surface.materials || [])[0];
    const hasImage = mat?.image;
    const surfFixtures = surface.fixtures || [];
    return (
      <div className="absolute inset-0 overflow-hidden cursor-pointer group"
        onClick={(e) => { e.stopPropagation(); handleCeilingFloorClick(surface); }}
        data-testid={`surface-${surface.surface_type}`}
        style={{ pointerEvents: 'auto' }}>
        {hasImage ? (
          <TilePatternCanvas pattern={mat.pattern || 'stacked_horizontal'} imageUrl={mat.image} tileCrop={mat.tile_crop}
            groutColor={mat.grout_color} tileOrientation={mat.tile_orientation} tileScale={mat.tile_scale} />
        ) : (
          <div className="absolute inset-0" style={{ background: surface.surface_type === 'ceiling' ? '#e8e5df' : '#d8d4ce' }} />
        )}
        {surfFixtures.map(f => <FixtureOverlay key={f.id} fixture={f} isSelected={selectedElement?.id === f.id}
          onDragStart={handleElementDragStart} />)}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[7px] font-black text-white/70 bg-black/40 z-10 pointer-events-none">{label}</div>
        {!hasImage && (
          <div className={`absolute inset-0 flex items-center justify-center transition-all ${selectedItem ? 'bg-amber-400/10 border-2 border-dashed border-amber-400/40' : ''}`}>
            <span className="text-amber-600/40 text-[9px] font-bold">{selectedItem ? 'CLICK TO PLACE' : ''}</span>
          </div>
        )}
      </div>
    );
  };

  const pickerSurface = patternPicker ? surfaces.find(s => s.id === patternPicker.surfaceId) : null;
  const pickerMat = pickerSurface ? (pickerSurface.materials || []).find(m => m.position_label === patternPicker?.zoneId) : null;

  return (
    <div data-testid="shower-3d-view">
      {/* 3D SHOWER ENCLOSURE — one-point perspective box using clip-path */}
      <div style={{ width: '100%', height: '720px', position: 'relative', background: '#0a0a10', borderRadius: '12px', overflow: 'hidden' }}>

        {/* CEILING — trapezoid */}
        <div style={{
          position: 'absolute', left: 0, top: 0, width: '100%', height: '10%',
          clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)',
          background: '#e8e5df', zIndex: 1,
        }}>
          {renderSimpleSurface(ceiling, ceiling?.name || 'CEILING')}
        </div>

        {/* LEFT WALL — trapezoid */}
        <div style={{
          position: 'absolute', left: 0, top: 0, width: '20%', height: '100%',
          clipPath: 'polygon(0% 0%, 100% 10%, 100% 82%, 0% 100%)',
          background: '#eae6e0', zIndex: 2,
        }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }} />
          {renderWallFace(leftWall, true)}
          <div className="absolute top-[12%] left-1 px-1.5 py-0.5 rounded text-[7px] font-black text-white/60 bg-black/40 z-10 pointer-events-none">{leftWall?.name || 'LEFT WALL'}</div>
        </div>

        {/* BACK WALL — flat center rectangle */}
        <div data-surface-id={backWall?.id} style={{
          position: 'absolute', left: '20%', top: '10%', width: '60%', height: '72%',
          background: '#f5f2ed', border: '2px solid #666', zIndex: 5,
          boxShadow: '0 4px 30px rgba(0,0,0,0.4), inset 0 0 30px rgba(0,0,0,0.04)',
        }}>
          {renderWallFace(backWall, false)}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[8px] font-black text-white/70 bg-black/40 z-10 pointer-events-none">{backWall?.name || 'BACK WALL'}</div>
          {/* Zone dimension labels on the right edge */}
          {backWall && getZoneConfig(backWall).reduce((acc, zone) => {
            const top = acc.top;
            acc.items.push(
              <div key={zone.id} className="absolute right-0 flex items-center z-20" style={{ top: `${top}%`, height: `${zone.height}%` }}>
                <div className="flex flex-col items-end pr-1 gap-0.5">
                  {editingDim?.surfaceId === backWall.id && editingDim?.zoneId === zone.id ? (
                    <input autoFocus value={dimValue} onChange={e => setDimValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { onEditDimension(backWall.id, zone.id, dimValue); setEditingDim(null); } if (e.key === 'Escape') setEditingDim(null); }}
                      onBlur={() => { onEditDimension(backWall.id, zone.id, dimValue); setEditingDim(null); }}
                      className="w-16 px-1 py-0 text-[9px] font-mono bg-black text-amber-300 border border-amber-400/60 rounded text-right"
                      onClick={e => e.stopPropagation()} data-testid={`dim-input-${zone.id}`} />
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setEditingDim({ surfaceId: backWall.id, zoneId: zone.id }); setDimValue(zone.dimension || ''); }}
                      className="px-1.5 py-0.5 rounded text-[8px] font-mono text-amber-300/70 bg-black/50 hover:bg-black/70 border border-transparent hover:border-amber-400/40 transition-all"
                      data-testid={`dim-label-${zone.id}`}>
                      {zone.dimension || 'SIZE'}
                    </button>
                  )}
                </div>
              </div>
            );
            acc.top += zone.height;
            return acc;
          }, { top: 0, items: [] }).items}
        </div>

        {/* RIGHT WALL — trapezoid */}
        <div style={{
          position: 'absolute', right: 0, top: 0, width: '20%', height: '100%',
          clipPath: 'polygon(0% 10%, 100% 0%, 100% 100%, 0% 82%)',
          background: '#e4e0da', zIndex: 2,
        }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.08), transparent)' }} />
          {renderWallFace(rightWall, true)}
          <div className="absolute top-[12%] right-1 px-1.5 py-0.5 rounded text-[7px] font-black text-white/60 bg-black/40 z-10 pointer-events-none">{rightWall?.name || 'RIGHT WALL'}</div>
        </div>

        {/* FLOOR — trapezoid, much larger and visible */}
        <div style={{
          position: 'absolute', left: 0, bottom: 0, width: '100%', height: '18%',
          clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
          background: '#d8d4ce', zIndex: 6,
        }}>
          {renderSimpleSurface(floor, floor?.name || 'FLOOR')}
        </div>

        {/* Corner shadow lines for depth */}
        <svg className="absolute inset-0 pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Top-left corner */}
          <line x1="0" y1="0" x2="20" y2="10" stroke="rgba(0,0,0,0.5)" strokeWidth="0.3" />
          {/* Top-right corner */}
          <line x1="100" y1="0" x2="80" y2="10" stroke="rgba(0,0,0,0.5)" strokeWidth="0.3" />
          {/* Bottom-left corner */}
          <line x1="0" y1="100" x2="20" y2="82" stroke="rgba(0,0,0,0.5)" strokeWidth="0.3" />
          {/* Bottom-right corner */}
          <line x1="100" y1="100" x2="80" y2="82" stroke="rgba(0,0,0,0.5)" strokeWidth="0.3" />
          {/* Back wall vertical edges */}
          <line x1="20" y1="10" x2="20" y2="82" stroke="rgba(0,0,0,0.4)" strokeWidth="0.25" />
          <line x1="80" y1="10" x2="80" y2="82" stroke="rgba(0,0,0,0.4)" strokeWidth="0.25" />
          {/* Back wall horizontal edges */}
          <line x1="20" y1="10" x2="80" y2="10" stroke="rgba(0,0,0,0.3)" strokeWidth="0.2" />
          <line x1="20" y1="82" x2="80" y2="82" stroke="rgba(0,0,0,0.3)" strokeWidth="0.2" />
        </svg>
      </div>

      {/* PATTERN PICKER + CONTROLS */}
      {patternPicker && pickerMat && (
        <div className="mt-3 p-4 rounded-xl border-2 border-amber-400/30 shadow-2xl" style={{ background: 'rgba(0,0,0,0.97)' }} data-testid="pattern-picker">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-black text-amber-400">
              PATTERN FOR: <span className="text-white">{getZoneConfig(pickerSurface).find(z => z.id === patternPicker.zoneId)?.label || patternPicker.zoneId}</span>
            </span>
            <button onClick={() => setPatternPicker(null)} className="text-white/40 hover:text-white"><X size={18} /></button>
          </div>
          {/* Grout + Orientation + Tile Size row */}
          <div className="flex items-center gap-4 mb-3 pb-3 border-b border-white/10 flex-wrap">
            <div className="flex items-center gap-2">
              <Palette size={12} className="text-white/40" />
              <span className="text-[10px] font-black text-white/50">GROUT:</span>
              {GROUT_COLORS.map(gc => (
                <button key={gc.value} onClick={() => onChangeGrout(patternPicker.surfaceId, pickerMat.id, gc.value)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${pickerMat.grout_color === gc.value ? 'border-amber-400 scale-125' : 'border-white/20 hover:border-white/40'}`}
                  style={{ background: gc.value }} title={gc.label} data-testid={`grout-${gc.label.toLowerCase().replace(' ', '-')}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <RotateCw size={12} className="text-white/40" />
              <span className="text-[10px] font-black text-white/50">TILE:</span>
              <button onClick={() => onChangeOrientation(patternPicker.surfaceId, pickerMat.id, 'horizontal')}
                className={`px-2 py-1 rounded text-[9px] font-black ${pickerMat.tile_orientation !== 'vertical' ? 'bg-amber-600 text-white' : 'text-white/30 border border-white/10'}`}
                data-testid="orient-horizontal">HORIZONTAL</button>
              <button onClick={() => onChangeOrientation(patternPicker.surfaceId, pickerMat.id, 'vertical')}
                className={`px-2 py-1 rounded text-[9px] font-black ${pickerMat.tile_orientation === 'vertical' ? 'bg-amber-600 text-white' : 'text-white/30 border border-white/10'}`}
                data-testid="orient-vertical">VERTICAL</button>
            </div>
            <div className="flex items-center gap-2">
              <Ruler size={12} className="text-white/40" />
              <span className="text-[10px] font-black text-white/50">TILE SIZE:</span>
              <input type="range" min={50} max={500} step={10}
                value={Math.round((pickerMat.tile_scale || 1) * 100)}
                onChange={e => onChangeTileScale(patternPicker.surfaceId, pickerMat.id, Number(e.target.value) / 100)}
                className="w-24 accent-amber-500" data-testid="tile-size-slider" />
              <span className="text-[9px] font-mono text-amber-300 w-8">{Math.round((pickerMat.tile_scale || 1) * 100)}%</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {TILE_PATTERNS.map(p => (
              <button key={p.value} onClick={() => onChangePattern(patternPicker.surfaceId, pickerMat.id, p.value)}
                className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${pickerMat.pattern === p.value ? 'border-amber-400 bg-amber-400/10 scale-105' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                data-testid={`pattern-${p.value}`}>
                <PatternThumb pattern={p.value} size={52} />
                <span className={`text-[7px] font-black mt-1 tracking-wider ${pickerMat.pattern === p.value ? 'text-amber-400' : 'text-white/60'}`}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SELECTED ELEMENT CONTROLS */}
      {selectedElement && (
        <SelectedElementPanel
          element={selectedElement}
          surfaces={surfaces}
          onDelete={onDeleteElement}
          onUpdate={onUpdateElement}
          onDeselect={() => onSelectElement(null)}
          selectedItem={selectedItem}
          onApplyTile={onApplyTileToElement}
        />
      )}
    </div>
  );
};


/* ==================== SELECTED ELEMENT PANEL ==================== */
const TRIM_OPTIONS = [
  { value: 'none', label: 'No Trim' },
  { value: 'schluter', label: 'Schluter (Metal)' },
  { value: 'bullnose', label: 'Bullnose' },
  { value: 'pencil', label: 'Pencil Liner' },
  { value: 'quarter_round', label: 'Quarter Round' },
];

const SelectedElementPanel = ({ element, surfaces, onDelete, onUpdate, onDeselect, selectedItem, onApplyTile }) => {
  if (!element) return null;
  let found = null, foundSurface = null;
  for (const s of surfaces) {
    if (element.type === 'niche') found = (s.niches || []).find(n => n.id === element.id);
    else if (element.type === 'bench') found = (s.benches || []).find(b => b.id === element.id);
    else if (element.type === 'fixture') found = (s.fixtures || []).find(f => f.id === element.id);
    if (found) { foundSurface = s; break; }
  }
  if (!found || !foundSurface) return null;
  const isNicheOrBench = element.type === 'niche' || element.type === 'bench';
  const hasTile = found.material?.image;

  return (
    <div className="mt-3 p-4 rounded-xl border-2 shadow-2xl" data-testid="element-panel"
      style={{ background: 'rgba(0,0,0,0.97)', borderColor: element.type === 'niche' ? 'rgba(0,200,255,0.3)' : element.type === 'bench' ? 'rgba(255,165,0,0.3)' : 'rgba(100,160,255,0.3)' }}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-black" style={{ color: element.type === 'niche' ? '#00c8ff' : element.type === 'bench' ? '#ffa500' : '#64a0ff' }}>
          {element.type.toUpperCase()} — {isNicheOrBench ? 'Drag corners to resize' : 'Drag to move'}
        </span>
        <div className="flex gap-2">
          {selectedItem && isNicheOrBench && (
            <button onClick={() => onApplyTile(foundSurface.id, element.type, element.id, selectedItem)}
              className="px-2 py-1 rounded text-[9px] font-black text-green-400 border border-green-400/30 hover:bg-green-400/10 animate-pulse" data-testid="apply-tile-to-element-btn">
              APPLY {selectedItem.name?.substring(0, 15)}
            </button>
          )}
          <button onClick={() => onDelete(foundSurface.id, element.type, element.id)} className="px-2 py-1 rounded text-[9px] font-black text-red-400 border border-red-400/30 hover:bg-red-400/10" data-testid="delete-element-btn">
            <Trash2 size={10} className="inline mr-1" />DELETE
          </button>
          <button onClick={onDeselect} className="text-white/40 hover:text-white"><X size={16} /></button>
        </div>
      </div>
      {/* Position & size controls */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {['x', 'y'].concat(isNicheOrBench ? ['w', 'h'] : []).map(field => (
          <div key={field}>
            <label className="text-[8px] font-black text-white/40 uppercase">{field === 'x' ? 'LEFT %' : field === 'y' ? 'TOP %' : field === 'w' ? 'WIDTH %' : 'HEIGHT %'}</label>
            <input type="number" min={0} max={100} value={Math.round(found[field] || 0)}
              onChange={e => onUpdate(foundSurface.id, element.type, element.id, { [field]: Number(e.target.value) })}
              className="w-full px-2 py-1 rounded text-[10px] font-mono bg-black border border-white/20 text-white" data-testid={`element-${field}`} />
          </div>
        ))}
      </div>
      {/* Bench/Niche specific: Dimension (inches) */}
      {isNicheOrBench && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[8px] font-black text-white/40 uppercase">WIDTH (inches)</label>
            <input type="text" placeholder='e.g. 36"' value={found.width_inches || ''}
              onChange={e => onUpdate(foundSurface.id, element.type, element.id, { width_inches: e.target.value })}
              className="w-full px-2 py-1 rounded text-[10px] font-mono bg-black border border-white/20 text-white" data-testid="element-width-inches" />
          </div>
          <div>
            <label className="text-[8px] font-black text-white/40 uppercase">HEIGHT (inches)</label>
            <input type="text" placeholder='e.g. 18"' value={found.height_inches || ''}
              onChange={e => onUpdate(foundSurface.id, element.type, element.id, { height_inches: e.target.value })}
              className="w-full px-2 py-1 rounded text-[10px] font-mono bg-black border border-white/20 text-white" data-testid="element-height-inches" />
          </div>
        </div>
      )}
      {/* Trim / Schluter */}
      {isNicheOrBench && (
        <div className="mb-3">
          <label className="text-[8px] font-black text-white/40 uppercase block mb-1">EDGE TRIM / SCHLUTER</label>
          <div className="flex gap-1 flex-wrap">
            {TRIM_OPTIONS.map(t => (
              <button key={t.value} onClick={() => onUpdate(foundSurface.id, element.type, element.id, { trim: t.value })}
                className={`px-2 py-1 rounded text-[9px] font-black transition-all ${(found.trim || 'none') === t.value ? 'bg-amber-600 text-white' : 'text-white/30 border border-white/10 hover:border-white/30'}`}
                data-testid={`trim-${t.value}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Tile info on element */}
      {hasTile && (
        <div className="pt-2 border-t border-white/10">
          <div className="text-[8px] font-black text-green-400/70 mb-1">TILE APPLIED</div>
          <div className="flex items-center gap-2">
            <img src={found.material.image} alt="" className="w-8 h-8 rounded object-cover border border-white/20" />
            <span className="text-[9px] text-white/50">{found.material.pattern || 'No pattern'}</span>
          </div>
        </div>
      )}
    </div>
  );
};


/* ==================== MEASUREMENT CANVAS ==================== */
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
  const getSvgPoint = (e) => { const rect = svgRef.current?.getBoundingClientRect(); if (!rect) return { x: 0, y: 0 }; return { x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 }; };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => setToolMode(toolMode === 'draw' ? 'select' : 'draw')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${toolMode === 'draw' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
          {toolMode === 'draw' ? <><Ruler size={10} /> DRAW</> : <><MousePointer size={10} /> SELECT</>}
        </button>
        <div className="flex gap-0.5">{LINE_COLORS.map(c => <button key={c} onClick={() => setActiveColor(c)} className={`w-4 h-4 rounded-full border-2 ${activeColor === c ? 'border-white scale-125' : 'border-transparent'}`} style={{ background: c }} />)}</div>
        {selectedLine && <>
          <button onClick={() => { setEditingId(selectedLine); setInputVal(lines.find(l => l.id === selectedLine)?.measurement || ''); }} className="ml-auto px-2 py-1 rounded text-[10px] text-white bg-blue-600"><Pencil size={10} className="inline mr-1" />EDIT</button>
          <button onClick={() => { onLinesChange(lines.filter(l => l.id !== selectedLine)); setSelectedLine(null); }} className="px-2 py-1 rounded text-[10px] text-white bg-red-600"><Trash2 size={10} className="inline mr-1" />DEL</button>
        </>}
      </div>
      <svg ref={svgRef} viewBox="0 0 100 60" className="w-full rounded" style={{ height: '120px', background: '#f5f5f0', border: '2px solid #aaa', cursor: toolMode === 'draw' ? 'crosshair' : 'default' }}
        onMouseDown={e => { if (toolMode !== 'draw') return; e.preventDefault(); const pt = getSvgPoint(e); setDrawing(true); setDrawStart(pt); setCurrentMouse(pt); }}
        onMouseMove={e => { if (drawing) setCurrentMouse(getSvgPoint(e)); }}
        onMouseUp={e => {
          if (!drawing || !drawStart) return; const end = getSvgPoint(e);
          if (Math.abs(end.x - drawStart.x) < 1 && Math.abs(end.y - drawStart.y) < 1) { setDrawing(false); setDrawStart(null); return; }
          const nl = { id: crypto.randomUUID(), start_x: drawStart.x, start_y: drawStart.y, end_x: end.x, end_y: end.y, measurement: '', color: activeColor, thickness: 2 };
          onLinesChange([...lines, nl]); setDrawing(false); setDrawStart(null); setEditingId(nl.id); setInputVal('');
        }}
        onMouseLeave={() => { if (drawing) { setDrawing(false); setDrawStart(null); } }}>
        <defs><pattern id="mgrid" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.1" /></pattern></defs>
        <rect width="100" height="60" fill="url(#mgrid)" />
        {lines.map(line => {
          const mx = (line.start_x + line.end_x) / 2, my = (line.start_y + line.end_y) / 2;
          const angle = Math.atan2(line.end_y - line.start_y, line.end_x - line.start_x) * 180 / Math.PI;
          const rad = angle * Math.PI / 180;
          const da = angle > 90 || angle < -90 ? angle + 180 : angle;
          return (<g key={line.id}>
            <line x1={line.start_x} y1={line.start_y} x2={line.end_x} y2={line.end_y} stroke={line.color} strokeWidth={0.6} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); if (toolMode === 'select') setSelectedLine(selectedLine === line.id ? null : line.id); }} />
            <line x1={line.start_x - 1.2 * Math.sin(rad)} y1={line.start_y + 1.2 * Math.cos(rad)} x2={line.start_x + 1.2 * Math.sin(rad)} y2={line.start_y - 1.2 * Math.cos(rad)} stroke={line.color} strokeWidth={0.3} />
            <line x1={line.end_x - 1.2 * Math.sin(rad)} y1={line.end_y + 1.2 * Math.cos(rad)} x2={line.end_x + 1.2 * Math.sin(rad)} y2={line.end_y - 1.2 * Math.cos(rad)} stroke={line.color} strokeWidth={0.3} />
            {line.measurement && <g transform={`translate(${mx + 1.5 * Math.sin(rad)}, ${my - 1.5 * Math.cos(rad)}) rotate(${da})`}><rect x={-line.measurement.length * 0.9} y="-2.2" width={line.measurement.length * 1.8} height="4" rx="0.5" fill="white" stroke={line.color} strokeWidth="0.2" /><text textAnchor="middle" dominantBaseline="middle" fill={line.color} fontSize="2.2" fontFamily="monospace" fontWeight="bold">{line.measurement}</text></g>}
            {selectedLine === line.id && <><circle cx={line.start_x} cy={line.start_y} r="1.2" fill={line.color} stroke="white" strokeWidth="0.3" /><circle cx={line.end_x} cy={line.end_y} r="1.2" fill={line.color} stroke="white" strokeWidth="0.3" /></>}
          </g>);
        })}
        {drawing && drawStart && currentMouse && <line x1={drawStart.x} y1={drawStart.y} x2={currentMouse.x} y2={currentMouse.y} stroke={activeColor} strokeWidth={0.5} strokeDasharray="1 0.5" opacity={0.7} />}
      </svg>
      {editingId && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 items-center p-3 rounded-lg shadow-xl z-30 border-2 border-red-400/40" style={{ background: '#fff' }}>
          <span className="text-xs font-bold text-gray-700">Measurement:</span>
          <input autoFocus placeholder='e.g. 72"' value={inputVal} onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { onLinesChange(lines.map(l => l.id === editingId ? { ...l, measurement: inputVal } : l)); setEditingId(null); } }}
            className="px-3 py-1.5 rounded border-2 border-gray-300 text-gray-900 text-sm w-28 focus:outline-none focus:border-red-500" data-testid="measurement-input" />
          <button onClick={() => { onLinesChange(lines.map(l => l.id === editingId ? { ...l, measurement: inputVal } : l)); setEditingId(null); }} className="px-3 py-1.5 rounded text-xs font-bold text-white bg-green-600">OK</button>
          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded text-xs text-gray-500">Skip</button>
        </div>
      )}
    </div>
  );
};


/* ==================== MAIN COMPONENT ==================== */
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
  const [placementMode, setPlacementMode] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const saveTimeoutRef = useRef(null);
  const [cropModal, setCropModal] = useState(null);
  const pendingPlaceRef = useRef(null);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/rooms/${roomId}/finish-schedules`);
      const data = await res.json();
      const enhanced = data.map(s => ({ ...s, surfaces: ensureAllSurfaces(s.surfaces) }));
      setSchedules(enhanced);
      if (enhanced.length > 0 && !activeSchedule) setActiveSchedule(enhanced[0]);
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
      if (updated.surfaces) updated.surfaces = ensureAllSurfaces(updated.surfaces);
      setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
      return updated;
    } catch (err) { console.error(err); }
  }, [projectId]);

  const debouncedSave = useCallback((schedule) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => save(schedule), 600);
  }, [save]);

  const updateSchedule = useCallback((updater) => {
    setActiveSchedule(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/rooms/${roomId}/finish-schedules`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_type: newType, name: newName.trim() })
      });
      const schedule = await res.json();
      schedule.surfaces = ensureAllSurfaces(schedule.surfaces);
      setSchedules(prev => [...prev, schedule]);
      setActiveSchedule(schedule); setShowCreate(false); setNewName('');
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

  const findExistingCropForItem = (itemId) => {
    if (!activeSchedule) return null;
    for (const surface of activeSchedule.surfaces) {
      for (const mat of (surface.materials || [])) {
        if (mat.item_id === itemId && mat.tile_crop && mat.tile_crop.w > 0) return mat.tile_crop;
      }
    }
    return null;
  };

  const handlePlaceItem = (surfaceId, zoneId, item) => {
    if (!activeSchedule || !item) return;
    const existingCrop = findExistingCropForItem(item.id);
    if (existingCrop) {
      placeItemWithCrop(surfaceId, zoneId, item, existingCrop);
    } else if (item._img) {
      pendingPlaceRef.current = { surfaceId, zoneId, item };
      setCropModal({ imageUrl: item._img, existingCrop: null, mode: 'place' });
    } else {
      placeItemWithCrop(surfaceId, zoneId, item, null);
    }
  };

  const placeItemWithCrop = (surfaceId, zoneId, item, tileCrop) => {
    updateSchedule(prev => {
      const targetSurface = prev.surfaces.find(s => s.id === surfaceId);
      const isBackWall = targetSurface?.name?.toLowerCase().includes('back');
      const matEntry = {
        item_id: item.id, name: item.name || '', vendor: item.vendor || '',
        sku: item.sku || '', size: item.size || '', color: item.finish_color || item.color || '',
        image: item._img || '', link: item.link || '', position_label: zoneId, pattern: '',
        tile_crop: tileCrop, grout_color: '#4a4035', tile_orientation: 'horizontal', tile_scale: 1.0,
      };
      return {
        ...prev,
        surfaces: prev.surfaces.map(s => {
          if (s.id === surfaceId) {
            const filtered = s.materials.filter(m => m.position_label !== zoneId);
            return { ...s, materials: [...filtered, { ...matEntry, id: crypto.randomUUID() }] };
          }
          // Auto-fill side walls when placing on back wall — ALWAYS overwrite to stay in sync
          if (isBackWall && s.surface_type === 'wall' && s.id !== surfaceId) {
            const filtered = s.materials.filter(m => m.position_label !== zoneId);
            return { ...s, materials: [...filtered, { ...matEntry, id: crypto.randomUUID() }] };
          }
          return s;
        })
      };
    });
  };

  const handlePlaceCeilingFloor = (surfaceId, item) => {
    if (!activeSchedule || !item) return;
    const existingCrop = findExistingCropForItem(item.id);
    if (existingCrop) {
      placeCeilingFloorWithCrop(surfaceId, item, existingCrop);
    } else if (item._img) {
      pendingPlaceRef.current = { surfaceId, zoneId: '_surface', item };
      setCropModal({ imageUrl: item._img, existingCrop: null, mode: 'place_surface' });
    } else {
      placeCeilingFloorWithCrop(surfaceId, item, null);
    }
  };

  const placeCeilingFloorWithCrop = (surfaceId, item, tileCrop) => {
    updateSchedule(prev => ({
      ...prev,
      surfaces: prev.surfaces.map(s => {
        if (s.id !== surfaceId) return s;
        return { ...s, materials: [{
          id: crypto.randomUUID(), item_id: item.id, name: item.name || '',
          vendor: item.vendor || '', image: item._img || '', position_label: '_surface',
          pattern: 'stacked_horizontal', tile_crop: tileCrop, grout_color: '#4a4035', tile_orientation: 'horizontal', tile_scale: 1.0,
        }] };
      })
    }));
  };

  const handlePlaceFixture = (surfaceId, zoneId, item, xPct, yPct) => {
    updateSchedule(prev => ({
      ...prev,
      surfaces: prev.surfaces.map(s => {
        if (s.id !== surfaceId) return s;
        return { ...s, fixtures: [...(s.fixtures || []), {
          id: crypto.randomUUID(), item_id: item.id, name: item.name || '',
          image: item._img || '', zone_id: zoneId, x: Math.round(xPct), y: Math.round(yPct),
        }] };
      })
    }));
    setPlacementMode(null);
  };

  const handleAddNiche = (surfaceId, zoneId, xPct, yPct) => {
    updateSchedule(prev => ({
      ...prev,
      surfaces: prev.surfaces.map(s => {
        if (s.id !== surfaceId) return s;
        return { ...s, niches: [...(s.niches || []), {
          id: crypto.randomUUID(), zone_id: zoneId,
          x: Math.max(0, Math.min(70, xPct - 15)), y: Math.max(0, Math.min(75, yPct - 12)),
          w: 30, h: 25, material: null, trim: 'none',
        }] };
      })
    }));
    setPlacementMode(null);
  };

  const handleAddBench = (surfaceId, zoneId, xPct, yPct) => {
    updateSchedule(prev => ({
      ...prev,
      surfaces: prev.surfaces.map(s => {
        if (s.id !== surfaceId) return s;
        return { ...s, benches: [...(s.benches || []), {
          id: crypto.randomUUID(), zone_id: '_wall_level',
          x: Math.max(0, Math.min(60, xPct - 20)), y: 0,
          w: 40, h: 22, material: null, trim: 'none',
        }] };
      })
    }));
    setPlacementMode(null);
  };

  const handleCropConfirm = (crop) => {
    if (cropModal?.mode === 'place' && pendingPlaceRef.current) {
      const { surfaceId, zoneId, item } = pendingPlaceRef.current;
      placeItemWithCrop(surfaceId, zoneId, item, crop);
      pendingPlaceRef.current = null;
    } else if (cropModal?.mode === 'place_surface' && pendingPlaceRef.current) {
      const { surfaceId, item } = pendingPlaceRef.current;
      placeCeilingFloorWithCrop(surfaceId, item, crop);
      pendingPlaceRef.current = null;
    } else if (cropModal?.mode === 'edit' && cropModal.surfaceId && cropModal.materialId) {
      updateMaterialField(cropModal.surfaceId, cropModal.materialId, 'tile_crop', crop);
    }
    setCropModal(null);
  };

  const updateMaterialField = (surfaceId, materialId, field, value) => {
    updateSchedule(prev => ({
      ...prev,
      surfaces: prev.surfaces.map(s => {
        if (s.id !== surfaceId) return s;
        return { ...s, materials: s.materials.map(m => m.id === materialId ? { ...m, [field]: value } : m) };
      })
    }));
  };

  const handleCropTile = (surfaceId, materialId, imageUrl, existingCrop) => {
    setCropModal({ surfaceId, materialId, imageUrl, existingCrop: existingCrop || null, mode: 'edit' });
  };

  const removeMaterial = (surfaceId, materialId) => {
    updateSchedule(prev => ({
      ...prev,
      surfaces: prev.surfaces.map(s =>
        s.id === surfaceId ? { ...s, materials: s.materials.filter(m => m.id !== materialId) } : s
      )
    }));
  };

  const changePattern = (surfaceId, materialId, pattern) => updateMaterialField(surfaceId, materialId, 'pattern', pattern);
  const changeGrout = (surfaceId, materialId, color) => updateMaterialField(surfaceId, materialId, 'grout_color', color);
  const changeOrientation = (surfaceId, materialId, orientation) => updateMaterialField(surfaceId, materialId, 'tile_orientation', orientation);
  const changeTileScale = (surfaceId, materialId, scale) => updateMaterialField(surfaceId, materialId, 'tile_scale', scale);

  const handleDeleteElement = (surfaceId, type, elementId) => {
    updateSchedule(prev => ({
      ...prev,
      surfaces: prev.surfaces.map(s => {
        if (s.id !== surfaceId) return s;
        if (type === 'niche') return { ...s, niches: (s.niches || []).filter(n => n.id !== elementId) };
        if (type === 'bench') return { ...s, benches: (s.benches || []).filter(b => b.id !== elementId) };
        if (type === 'fixture') return { ...s, fixtures: (s.fixtures || []).filter(f => f.id !== elementId) };
        return s;
      })
    }));
    setSelectedElement(null);
  };

  const handleUpdateElement = (surfaceId, type, elementId, updates) => {
    updateSchedule(prev => ({
      ...prev,
      surfaces: prev.surfaces.map(s => {
        if (s.id !== surfaceId) return s;
        if (type === 'niche') return { ...s, niches: (s.niches || []).map(n => n.id === elementId ? { ...n, ...updates } : n) };
        if (type === 'bench') return { ...s, benches: (s.benches || []).map(b => b.id === elementId ? { ...b, ...updates } : b) };
        if (type === 'fixture') return { ...s, fixtures: (s.fixtures || []).map(f => f.id === elementId ? { ...f, ...updates } : f) };
        return s;
      })
    }));
  };

  const handleApplyTileToElement = (surfaceId, elementType, elementId, item) => {
    const existingCrop = findExistingCropForItem(item.id);
    const material = {
      image: item._img || '', pattern: 'stacked_horizontal',
      tile_crop: existingCrop || null, grout_color: '#4a4035',
      tile_orientation: 'horizontal', tile_scale: 1.0,
    };
    updateSchedule(prev => ({
      ...prev,
      surfaces: prev.surfaces.map(s => {
        if (s.id !== surfaceId) return s;
        if (elementType === 'niche') return { ...s, niches: (s.niches || []).map(n => n.id === elementId ? { ...n, material } : n) };
        if (elementType === 'bench') return { ...s, benches: (s.benches || []).map(b => b.id === elementId ? { ...b, material } : b) };
        return s;
      })
    }));
  };

  const handleEditDimension = (surfaceId, zoneId, value) => {
    updateSchedule(prev => ({
      ...prev,
      surfaces: prev.surfaces.map(s => {
        if (s.id !== surfaceId) return s;
        return { ...s, zone_config: (s.zone_config || DEFAULT_ZONE_CONFIG.map(z => ({ ...z }))).map(z =>
          z.id === zoneId ? { ...z, dimension: value } : z
        ) };
      })
    }));
  };

  const handleResizeZone = (surfaceId, newConfig) => {
    updateSchedule(prev => ({
      ...prev,
      surfaces: prev.surfaces.map(s =>
        s.id === surfaceId ? { ...s, zone_config: newConfig } : s
      )
    }));
  };

  const handleLinesChange = (newLines) => {
    updateSchedule(prev => ({ ...prev, measurement_lines: newLines }));
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  const itemsWithImages = roomItems.filter(i => i._img);

  const modeLabel = placementMode === 'niche' ? 'NICHE MODE: Click a wall zone to place a niche'
    : placementMode === 'bench' ? 'BENCH MODE: Click a wall zone to place a bench'
    : placementMode === 'fixture' ? 'FIXTURE MODE: Select an item, then click a wall to place it'
    : selectedItem ? `SELECTED: ${selectedItem.name} — click a zone to place as tile`
    : 'Select a tile below, then click a zone on the shower to place it.';

  const modeColor = placementMode === 'niche' ? 'text-cyan-400' : placementMode === 'bench' ? 'text-orange-400' : placementMode === 'fixture' ? 'text-blue-400' : selectedItem ? 'text-green-400 animate-pulse' : 'text-amber-400/80';

  return (
    <div data-testid="room-finish-schedule" style={{ background: '#1a1a24' }} className="rounded-xl">
      {cropModal && <TileCropModal imageUrl={cropModal.imageUrl} existingCrop={cropModal.existingCrop} onConfirm={handleCropConfirm} onCancel={() => { pendingPlaceRef.current = null; setCropModal(null); }} />}

      {/* MATERIAL PALETTE */}
      <div className="p-4 border-b border-white/10" style={{ background: 'linear-gradient(180deg, #222230 0%, #1a1a24 100%)' }}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-lg font-black text-white">{roomName} — Finish Schedule</h3>
            <div className={`text-xs font-bold mt-0.5 ${modeColor}`}>{modeLabel}</div>
          </div>
          <div className="flex gap-2">
            {(selectedItem || placementMode) && (
              <button onClick={() => { setSelectedItem(null); setPlacementMode(null); setSelectedElement(null); }}
                className="px-3 py-1.5 rounded text-xs font-bold text-red-400 border border-red-400/30" data-testid="deselect-btn">
                <X size={12} className="inline mr-1" />CANCEL
              </button>
            )}
            {onClose && <button onClick={onClose} className="px-3 py-1.5 rounded text-xs text-white/40 border border-white/10"><X size={14} /></button>}
          </div>
        </div>
        {roomItems.length === 0 ? (
          <div className="text-white/20 text-sm py-4 text-center">No items — add items via Checklist or FFE first</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {itemsWithImages.map(item => (
              <button key={item.id} data-testid={`palette-item-${item.id}`}
                onClick={() => { setSelectedItem(selectedItem?.id === item.id ? null : item); setSelectedElement(null); setPlacementMode(null); }}
                className={`flex-shrink-0 rounded-lg overflow-hidden transition-all w-24 ${selectedItem?.id === item.id ? 'ring-3 ring-green-400 scale-105' : 'ring-1 ring-white/10 hover:ring-white/30'}`}>
                <img src={item._img} alt={item.name} className="w-full h-20 object-cover" />
                <div className="p-1" style={{ background: '#111' }}>
                  <div className="text-white text-[8px] font-black truncate">{item.name}</div>
                  <div className="text-white/40 text-[7px] truncate">{item.vendor} {item.size ? `| ${item.size}` : ''}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SCHEDULE CONTENT */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div className="flex gap-1 overflow-x-auto">
            {schedules.map(s => (
              <button key={s.id} onClick={() => { setActiveSchedule(s); setSelectedElement(null); }}
                className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap ${activeSchedule?.id === s.id ? 'bg-amber-600 text-white' : 'text-white/30 border border-white/10'}`}>{s.name}</button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 rounded text-xs font-bold text-white bg-amber-700" data-testid="create-schedule-btn"><Plus size={12} className="inline mr-1" />NEW</button>
            {activeSchedule && <>
              <button onClick={() => setShowMeasurements(!showMeasurements)}
                className={`px-2 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 ${showMeasurements ? 'bg-red-600 text-white' : 'text-white/30 border border-white/10'}`}
                data-testid="toggle-measurements-btn"><Ruler size={10} />DIMS</button>
              <button onClick={() => setPlacementMode(placementMode === 'niche' ? null : 'niche')}
                className={`px-2 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 ${placementMode === 'niche' ? 'bg-cyan-600 text-white' : 'text-white/30 border border-white/10'}`}
                data-testid="add-niche-btn"><Square size={10} />NICHE</button>
              <button onClick={() => setPlacementMode(placementMode === 'bench' ? null : 'bench')}
                className={`px-2 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 ${placementMode === 'bench' ? 'bg-orange-600 text-white' : 'text-white/30 border border-white/10'}`}
                data-testid="add-bench-btn"><GripVertical size={10} />BENCH</button>
              <button onClick={() => setPlacementMode(placementMode === 'fixture' ? null : 'fixture')}
                className={`px-2 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 ${placementMode === 'fixture' ? 'bg-blue-600 text-white' : 'text-white/30 border border-white/10'}`}
                data-testid="add-fixture-btn"><Droplet size={10} />FIXTURE</button>
              <button onClick={() => handleDelete(activeSchedule.id)} className="px-2 py-1.5 rounded text-[10px] text-red-400 border border-red-400/20"><Trash2 size={10} /></button>
            </>}
          </div>
        </div>

        {showCreate && (
          <div className="mb-3 p-3 rounded-lg border border-white/10" style={{ background: '#222' }}>
            <input type="text" data-testid="schedule-name-input" placeholder="Name (e.g. Primary Shower)" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }} className="w-full px-3 py-2 mb-2 rounded border border-white/20 bg-black text-white text-sm" />
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
            {showMeasurements && <div className="mb-4"><MeasurementCanvas lines={activeSchedule.measurement_lines || []} onLinesChange={handleLinesChange} /></div>}

            <Shower3DView
              schedule={activeSchedule}
              selectedItem={selectedItem}
              placementMode={placementMode}
              selectedElement={selectedElement}
              onPlaceItem={handlePlaceItem}
              onPlaceFixture={handlePlaceFixture}
              onAddNiche={handleAddNiche}
              onAddBench={handleAddBench}
              onRemoveMaterial={removeMaterial}
              onChangePattern={changePattern}
              onCropTile={handleCropTile}
              onChangeGrout={changeGrout}
              onChangeOrientation={changeOrientation}
              onChangeTileScale={changeTileScale}
              onSelectElement={setSelectedElement}
              onDeleteElement={handleDeleteElement}
              onUpdateElement={handleUpdateElement}
              onApplyTileToElement={handleApplyTileToElement}
              onResizeZone={handleResizeZone}
              onEditDimension={handleEditDimension}
              onPlaceCeilingFloor={handlePlaceCeilingFloor}
            />

            <div className="mt-3 flex gap-1 flex-wrap">
              {activeSchedule.surfaces.map(s => (
                <span key={s.id} className="px-2 py-1 rounded text-[8px] font-bold text-white/40 bg-white/5 flex items-center gap-1">
                  <span className={s.surface_type === 'ceiling' ? 'text-purple-300' : s.surface_type === 'floor' ? 'text-green-300' : 'text-white/40'}>{s.name}</span>
                </span>
              ))}
            </div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-white/20 text-lg font-bold mb-2">No finish schedules yet</div>
            <div className="text-white/10 text-sm">Click NEW to create a tile schedule</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RoomFinishSchedule;

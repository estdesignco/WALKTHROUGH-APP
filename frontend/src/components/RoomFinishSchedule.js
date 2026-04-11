import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ruler, Plus, Trash2, MousePointer, X, Pencil, Crop, RotateCw, Palette } from 'lucide-react';

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

const getItemImage = (item) =>
  item.image_url || item.finish_image || item.image || (item.photos?.length ? item.photos[0] : '') || '';

// SVG PATTERN THUMBNAILS
const PatternThumb = ({ pattern, size = 80 }) => {
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
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/><rect x="8" y="2" width="5" height="16" fill={f} stroke={k} strokeWidth={w} rx=".3"/><rect x="15" y="10" width="5" height="16" fill={f} stroke={k} strokeWidth={w} rx=".3"/><rect x="22" y="2" width="5" height="16" fill={f} stroke={k} strokeWidth={w} rx=".3"/><rect x="8" y="20" width="5" height="16" fill={f} stroke={k} strokeWidth={w} rx=".3"/><rect x="15" y="28" width="5" height="16" fill={f} stroke={k} strokeWidth={w} rx=".3"/><rect x="22" y="20" width="5" height="16" fill={f} stroke={k} strokeWidth={w} rx=".3"/></svg>);
    case 'basket_weave':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/>{[0,20].map(y=>[0,20].map(x=><g key={`h${x}${y}`}><rect x={x+1} y={y+1} width={18} height={8} fill={f} stroke={k} strokeWidth={w} rx=".3"/><rect x={x+1} y={y+11} width={18} height={8} fill={f} stroke={k} strokeWidth={w} rx=".3"/></g>))}{[0,20].map(y=>[10,30].map(x=><g key={`v${x}${y}`}><rect x={x+1} y={y+1} width={8} height={18} fill={f} stroke={k} strokeWidth={w} rx=".3"/></g>))}</svg>);
    case 'stepladder':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/>{[0,8,16,24,32].map((x,i)=>{const o=(i%4)*5; return [-10+o,10+o,30+o].map(y=><rect key={`${x}${y}`} x={x+.5} y={y+.5} width={7} height={19} fill={f} stroke={k} strokeWidth={w} rx=".3"/>)})}</svg>);
    case 'diagonal':
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/><g transform="translate(20,20) rotate(45)">{[-20,-10,0,10].map(y=>[-30,-10,10].map(x=><rect key={`${x}${y}`} x={x+.5} y={y+.5} width={19} height={9} fill={f} stroke={k} strokeWidth={w} rx=".3"/>))}</g></svg>);
    default:
      return (<svg width={s} height={s} viewBox="0 0 40 40"><rect width="40" height="40" fill="#e8e8e8"/><rect x="1" y="1" width="38" height="38" fill={f} stroke={k} strokeWidth={w}/></svg>);
  }
};

// TILE CROP MODAL
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
    img.onerror = () => {
      const img2 = new Image();
      img2.onload = () => { imgRef.current = img2; setImgLoaded(true); };
      img2.src = imageUrl;
    };
    img.src = proxyUrl;
  }, [imageUrl]);

  const redraw = useCallback((currentCrop) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const maxW = 520, maxH = 420;
    const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    scaleRef.current = s;
    canvas.width = Math.round(img.naturalWidth * s);
    canvas.height = Math.round(img.naturalHeight * s);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (currentCrop && currentCrop.w > 2 && currentCrop.h > 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = currentCrop.x * s, cy = currentCrop.y * s, cw = currentCrop.w * s, ch = currentCrop.h * s;
      ctx.drawImage(img, currentCrop.x, currentCrop.y, currentCrop.w, currentCrop.h, cx, cy, cw, ch);
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(cx, cy, cw, ch);
      ctx.setLineDash([]);
      const preview = previewCanvasRef.current;
      if (preview) {
        const pSize = 120;
        const aspect = currentCrop.w / currentCrop.h;
        preview.width = aspect >= 1 ? pSize : Math.round(pSize * aspect);
        preview.height = aspect >= 1 ? Math.round(pSize / aspect) : pSize;
        preview.getContext('2d').drawImage(img, currentCrop.x, currentCrop.y, currentCrop.w, currentCrop.h, 0, 0, preview.width, preview.height);
      }
    }
  }, []);

  useEffect(() => { if (imgLoaded) redraw(crop); }, [imgLoaded, crop, redraw]);

  const getImageCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const s = scaleRef.current;
    return { x: (e.clientX - rect.left) / s, y: (e.clientY - rect.top) / s };
  };

  const validCrop = crop && crop.w > 10 && crop.h > 10;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.88)' }} data-testid="tile-crop-modal">
      <div className="rounded-xl p-6 max-w-[720px] w-full mx-4" style={{ background: '#1c1c2a', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 className="text-white font-black text-lg mb-1">EXTRACT SINGLE TILE</h3>
        <p className="text-white/50 text-sm mb-4">Draw a rectangle around <span className="text-green-400 font-bold">ONE individual tile</span> in the source image.</p>
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
        <div className="flex gap-3 mt-5">
          <button disabled={!validCrop} onClick={() => onConfirm(crop)} className="px-6 py-2.5 rounded-lg text-sm font-black text-black bg-green-400 hover:bg-green-300 disabled:opacity-30 disabled:cursor-not-allowed" data-testid="crop-confirm-btn">USE THIS TILE</button>
          <button onClick={onCancel} className="px-4 py-2.5 rounded-lg text-sm text-white/50 border border-white/20 hover:border-white/40" data-testid="crop-cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};


// CANVAS TILE PATTERN RENDERER
const drawTilePattern = (ctx, tileImg, pattern, w, h, groutColor, orientation) => {
  const grout = 5;
  const gc = groutColor || '#4a4035';
  ctx.fillStyle = gc;
  ctx.fillRect(0, 0, w, h);

  const imgW = tileImg.width || tileImg.naturalWidth || 200;
  const imgH = tileImg.height || tileImg.naturalHeight || 200;

  const drawTile = (x, y, tw, th) => {
    if (x + tw < 0 || x > w || y + th < 0 || y > h) return;
    ctx.drawImage(tileImg, 0, 0, imgW, imgH, x, y, tw, th);
    const hash = Math.abs(((x * 7919 + y * 104729) | 0) % 10000);
    const bright = ((hash % 7) - 3) * 0.012;
    if (bright !== 0) {
      ctx.fillStyle = bright > 0 ? `rgba(255,255,255,${bright})` : `rgba(0,0,0,${-bright})`;
      ctx.fillRect(x, y, tw, th);
    }
    const bev = Math.max(1, Math.min(tw, th) * 0.025);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, tw, bev);
    ctx.fillRect(x, y, bev, th);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(x, y + th - bev, tw, bev);
    ctx.fillRect(x + tw - bev, y, bev, th);
  };

  // Base tile dimensions
  let tl = Math.max(60, Math.min(140, h * 0.6));
  let ts = Math.max(18, Math.round(tl / 3.5));

  // Flip if vertical orientation
  if (orientation === 'vertical') {
    const tmp = tl; tl = ts; ts = tmp;
  }

  const g = grout;

  switch (pattern) {
    case 'stacked_horizontal': {
      for (let y = -ts; y < h + ts * 2; y += ts + g)
        for (let x = -tl; x < w + tl * 2; x += tl + g)
          drawTile(x, y, tl, ts);
      break;
    }
    case 'stacked_vertical': {
      for (let x = -ts; x < w + ts * 2; x += ts + g)
        for (let y = -tl; y < h + tl * 2; y += tl + g)
          drawTile(x, y, ts, tl);
      break;
    }
    case 'offset': {
      let row = 0;
      for (let y = -ts; y < h + ts * 2; y += ts + g, row++) {
        const off = (row % 2) * ((tl + g) / 2);
        for (let x = -tl * 2; x < w + tl * 2; x += tl + g)
          drawTile(x + off, y, tl, ts);
      }
      break;
    }
    case 'one_third_offset': {
      let row = 0;
      for (let y = -ts; y < h + ts * 2; y += ts + g, row++) {
        const off = (row % 3) * ((tl + g) / 3);
        for (let x = -tl * 2; x < w + tl * 2; x += tl + g)
          drawTile(x + off, y, tl, ts);
      }
      break;
    }
    case 'herringbone': {
      // Classic herringbone: V-shaped zigzag
      const tw = Math.max(20, ts);
      const th = Math.max(50, tl);
      const stepX = tw + g;
      const stepY = th + g;
      for (let row = -2; row < Math.ceil(h / (tw + g)) + 4; row++) {
        for (let col = -2; col < Math.ceil(w / (th + g)) + 4; col++) {
          const bx = col * (th + g);
          const by = row * (tw * 2 + g * 2);
          // Horizontal tile
          drawTile(bx, by + (col % 2) * (tw + g), th, tw);
          // Vertical tile
          drawTile(bx + th - tw, by + (col % 2) * (tw + g) + tw + g, tw, th);
        }
      }
      break;
    }
    case 'herringbone_vertical': {
      // Straight up and down herringbone — tiles alternate left-lean/right-lean in columns
      const tw = Math.max(18, ts);
      const th = Math.max(50, tl);
      for (let col = -4; col < Math.ceil(w / (tw + g)) + 4; col++) {
        for (let row = -4; row < Math.ceil(h / (th / 2 + g)) + 4; row++) {
          const x = col * (tw * 2 + g);
          const y = row * (th / 2 + g);
          if (row % 2 === 0) {
            drawTile(x, y, tw, th);
            drawTile(x + tw + g, y + th / 2, tw, th);
          } else {
            drawTile(x + tw + g, y, tw, th);
            drawTile(x, y + th / 2, tw, th);
          }
        }
      }
      break;
    }
    case 'basket_weave': {
      const block = ts * 2 + g;
      const cell = block + g;
      for (let gy = -2; gy < Math.ceil(h / cell) + 2; gy++) {
        for (let gx = -2; gx < Math.ceil(w / cell) + 2; gx++) {
          const bx = gx * cell, by = gy * cell;
          if ((gx + gy) % 2 === 0) {
            drawTile(bx, by, block, ts);
            drawTile(bx, by + ts + g, block, ts);
          } else {
            drawTile(bx, by, ts, block);
            drawTile(bx + ts + g, by, ts, block);
          }
        }
      }
      break;
    }
    case 'stepladder': {
      let col = 0;
      for (let x = -ts; x < w + ts * 2; x += ts + g, col++) {
        const off = ((col % 4) * ((tl + g) / 4));
        for (let y = -tl * 2 + off; y < h + tl * 2; y += tl + g)
          drawTile(x, y, ts, tl);
      }
      break;
    }
    case 'diagonal': {
      const sq = Math.max(40, Math.min(80, h * 0.35));
      const step = sq + g;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(Math.PI / 4);
      const range = Math.max(w, h) * 1.5;
      for (let y = -range; y < range; y += step)
        for (let x = -range; x < range; x += step)
          drawTile(x, y, sq, sq);
      ctx.restore();
      break;
    }
    default: {
      ctx.drawImage(tileImg, 0, 0, w, h);
    }
  }
};


// TilePatternCanvas — creates offscreen canvas with single tile, renders pattern
const TilePatternCanvas = ({ pattern, imageUrl, tileCrop, groutColor, tileOrientation }) => {
  const containerRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const imgRef = React.useRef(null);

  const draw = React.useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!container || !canvas || !img) return;
    if (!img.complete || img.naturalWidth === 0) return;
    const rect = container.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w < 10 || h < 10) return;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');

    const crop = (tileCrop && tileCrop.w > 0 && tileCrop.h > 0)
      ? tileCrop
      : { x: Math.round(img.naturalWidth * 0.38), y: Math.round(img.naturalHeight * 0.38), w: Math.round(img.naturalWidth * 0.24), h: Math.round(img.naturalHeight * 0.24) };

    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = Math.max(1, Math.round(crop.w));
    tileCanvas.height = Math.max(1, Math.round(crop.h));
    tileCanvas.getContext('2d').drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, tileCanvas.width, tileCanvas.height);

    drawTilePattern(ctx, tileCanvas, pattern, w, h, groutColor, tileOrientation);
  }, [pattern, tileCrop, groutColor, tileOrientation]);

  React.useEffect(() => {
    if (!imageUrl) return;
    const proxyUrl = `${API_URL}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; draw(); };
    img.onerror = () => {
      const img2 = new Image();
      img2.onload = () => { imgRef.current = img2; draw(); };
      img2.src = imageUrl;
    };
    img.src = proxyUrl;
    return () => { img.onload = null; img.onerror = null; };
  }, [imageUrl, draw]);

  React.useEffect(() => { draw(); }, [draw]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, display: 'block' }} />
    </div>
  );
};


// WALL ZONE — renders a single zone on a wall face
const WallZone = ({ zone, mat, isSelected, onClickZone, onRemove, onOpenPattern, onCropTile, compact }) => {
  const hasImage = mat?.image;
  const hasCrop = mat?.tile_crop && mat.tile_crop.w > 0;
  const patternLabel = mat?.pattern ? TILE_PATTERNS.find(p => p.value === mat.pattern)?.label : null;

  return (
    <div
      className="absolute left-0 right-0 cursor-pointer transition-all group overflow-hidden"
      style={{ top: `${zone.top}%`, height: `${zone.height}%` }}
      onClick={onClickZone}
      data-testid={`wall-zone-${zone.id}`}
    >
      {hasImage && mat.pattern && (
        <TilePatternCanvas
          key={`${mat.pattern}-${mat.id}-${hasCrop ? 'c' : 'r'}-${mat.grout_color}-${mat.tile_orientation}`}
          pattern={mat.pattern}
          imageUrl={mat.image}
          tileCrop={mat.tile_crop}
          groutColor={mat.grout_color}
          tileOrientation={mat.tile_orientation}
        />
      )}
      {hasImage && !mat.pattern && (
        <div className="absolute inset-0" style={{ backgroundImage: `url(${mat.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}
      {!hasImage && (
        <div className="absolute inset-0" style={{ background: '#f5f5f0', borderBottom: '1px solid #ddd' }}>
          {isSelected && <div className="absolute inset-0 border-2 border-dashed border-amber-400/40 bg-amber-400/5 flex items-center justify-center"><span className="text-amber-600/40 text-[9px] font-bold">CLICK TO PLACE</span></div>}
        </div>
      )}
      {hasImage && !hasCrop && (
        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black text-orange-300 bg-black/70 animate-pulse z-10">CROP TILE</div>
      )}
      <div className={`absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-0.5 ${compact ? 'py-0' : ''}`} style={hasImage ? { background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' } : { borderTop: '1px solid #ddd' }}>
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className={`text-[${compact ? '8' : '10'}px] font-black uppercase tracking-wider ${hasImage ? 'text-white' : 'text-gray-400'}`}>{zone.label}</span>
          {mat && !compact && <span className="px-1 py-0 rounded text-[9px] font-bold text-white/90 bg-black/50 truncate max-w-[120px]">{mat.name}</span>}
          {patternLabel && <span className="px-1 py-0 rounded text-[8px] font-black text-amber-300 bg-black/60">{patternLabel}</span>}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {mat && <>
            <button onClick={e => { e.stopPropagation(); onCropTile(); }} className={`px-1.5 py-0.5 rounded text-[9px] font-black flex items-center gap-0.5 ${hasCrop ? 'text-green-300 bg-black/80 border border-green-400/40' : 'text-orange-300 bg-black/80 border border-orange-400/60 animate-pulse'}`} data-testid={`crop-btn-${zone.id}`}><Crop size={9} />CROP</button>
            <button onClick={e => { e.stopPropagation(); onOpenPattern(); }} className="px-1.5 py-0.5 rounded text-[9px] font-black text-amber-300 bg-black/80 border border-amber-400/40" data-testid={`pattern-btn-${zone.id}`}>PATTERN</button>
            <button onClick={e => { e.stopPropagation(); onRemove(); }} className="px-1 py-0.5 rounded text-[9px] text-red-300 bg-black/80"><Trash2 size={10} /></button>
          </>}
        </div>
      </div>
    </div>
  );
};


// 3D SHOWER VIEW — renders back wall + 2 angled side walls
const Shower3DView = ({ surfaces, selectedItem, onPlaceItem, onRemoveMaterial, onChangePattern, onCropTile, onChangeGrout, onChangeOrientation }) => {
  const [patternPicker, setPatternPicker] = useState(null); // { surfaceId, zoneId }

  const defaultZones = [
    { id: 'upper_accent', label: 'Upper', top: 0, height: 25 },
    { id: 'main_wall', label: 'Main Wall', top: 25, height: 45 },
    { id: 'wainscot', label: 'Wainscot', top: 70, height: 15 },
    { id: 'floor', label: 'Floor', top: 85, height: 15 },
  ];

  // Map surfaces to shower positions
  const backWall = surfaces.find(s => s.name?.toLowerCase().includes('back')) || surfaces[0];
  const leftWall = surfaces.find(s => s.name?.toLowerCase().includes('left')) || surfaces[1];
  const rightWall = surfaces.find(s => s.name?.toLowerCase().includes('right')) || surfaces[2];

  const getZoneMap = (surface) => {
    const map = {};
    (surface?.materials || []).forEach(mat => { if (mat.position_label) map[mat.position_label] = mat; });
    return map;
  };

  const renderWallFace = (surface, compact) => {
    if (!surface) return <div className="absolute inset-0" style={{ background: '#f0ede8' }} />;
    const zoneMap = getZoneMap(surface);
    return defaultZones.map(zone => {
      const mat = zoneMap[zone.id];
      return (
        <WallZone
          key={zone.id}
          zone={zone}
          mat={mat}
          isSelected={!!selectedItem}
          compact={compact}
          onClickZone={() => { if (selectedItem) onPlaceItem(surface.id, zone.id, selectedItem); }}
          onRemove={() => mat && onRemoveMaterial(surface.id, mat.id)}
          onOpenPattern={() => setPatternPicker(patternPicker?.zoneId === zone.id && patternPicker?.surfaceId === surface.id ? null : { surfaceId: surface.id, zoneId: zone.id })}
          onCropTile={() => mat && onCropTile(surface.id, mat.id, mat.image, mat.tile_crop)}
        />
      );
    });
  };

  const pickerSurface = patternPicker ? surfaces.find(s => s.id === patternPicker.surfaceId) : null;
  const pickerMat = pickerSurface ? (pickerSurface.materials || []).find(m => m.position_label === patternPicker?.zoneId) : null;

  return (
    <div data-testid="shower-3d-view">
      {/* 3D SHOWER ENCLOSURE */}
      <div style={{ perspective: '1400px', perspectiveOrigin: '50% 42%', width: '100%', height: '520px', position: 'relative' }}>
        <div style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%', position: 'relative' }}>

          {/* LEFT WALL */}
          <div style={{
            position: 'absolute', left: 0, top: 0, width: '22%', height: '100%',
            transformOrigin: 'right center', transform: 'rotateY(42deg)',
            overflow: 'hidden', borderRadius: '4px 0 0 4px',
            boxShadow: 'inset -20px 0 40px rgba(0,0,0,0.15)',
          }}>
            <div className="absolute inset-0" style={{ background: '#eae6e0' }} />
            {renderWallFace(leftWall, true)}
            {/* Shading overlay for depth */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.08), rgba(0,0,0,0.02))' }} />
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black text-white/60 bg-black/40 z-10">{leftWall?.name || 'LEFT WALL'}</div>
          </div>

          {/* BACK WALL (center, flat) */}
          <div style={{
            position: 'absolute', left: '22%', top: 0, width: '56%', height: '100%',
            overflow: 'hidden', border: '2px solid #999',
            boxShadow: '0 4px 30px rgba(0,0,0,0.3), inset 0 0 40px rgba(0,0,0,0.05)',
          }}>
            <div className="absolute inset-0" style={{ background: '#f5f2ed' }} />
            {renderWallFace(backWall, false)}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-black text-white/70 bg-black/40 z-10">{backWall?.name || 'BACK WALL'}</div>
          </div>

          {/* RIGHT WALL */}
          <div style={{
            position: 'absolute', right: 0, top: 0, width: '22%', height: '100%',
            transformOrigin: 'left center', transform: 'rotateY(-42deg)',
            overflow: 'hidden', borderRadius: '0 4px 4px 0',
            boxShadow: 'inset 20px 0 40px rgba(0,0,0,0.15)',
          }}>
            <div className="absolute inset-0" style={{ background: '#e4e0da' }} />
            {renderWallFace(rightWall, true)}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.08), rgba(0,0,0,0.02))' }} />
            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-black text-white/60 bg-black/40 z-10">{rightWall?.name || 'RIGHT WALL'}</div>
          </div>

          {/* Corner shadows */}
          <div className="absolute pointer-events-none" style={{ left: '21.5%', top: 0, width: '4px', height: '100%', background: 'rgba(0,0,0,0.25)', zIndex: 20 }} />
          <div className="absolute pointer-events-none" style={{ right: '21.5%', top: 0, width: '4px', height: '100%', background: 'rgba(0,0,0,0.25)', zIndex: 20 }} />
        </div>
      </div>

      {/* PATTERN PICKER + GROUT COLOR + ORIENTATION */}
      {patternPicker && pickerMat && (
        <div className="mt-3 p-4 rounded-xl border-2 border-amber-400/30 shadow-2xl" style={{ background: 'rgba(0,0,0,0.97)' }} data-testid="pattern-picker">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-black text-amber-400">
              PATTERN FOR: <span className="text-white">{defaultZones.find(z => z.id === patternPicker.zoneId)?.label}</span>
            </span>
            <button onClick={() => setPatternPicker(null)} className="text-white/40 hover:text-white"><X size={18} /></button>
          </div>

          {/* Grout Color + Tile Orientation row */}
          <div className="flex items-center gap-4 mb-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Palette size={12} className="text-white/40" />
              <span className="text-[10px] font-black text-white/50">GROUT:</span>
              {GROUT_COLORS.map(gc => (
                <button key={gc.value} onClick={() => onChangeGrout(patternPicker.surfaceId, pickerMat.id, gc.value)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${pickerMat.grout_color === gc.value ? 'border-amber-400 scale-125' : 'border-white/20 hover:border-white/40'}`}
                  style={{ background: gc.value }} title={gc.label} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <RotateCw size={12} className="text-white/40" />
              <span className="text-[10px] font-black text-white/50">TILE:</span>
              <button onClick={() => onChangeOrientation(patternPicker.surfaceId, pickerMat.id, 'horizontal')}
                className={`px-2 py-1 rounded text-[9px] font-black ${pickerMat.tile_orientation !== 'vertical' ? 'bg-amber-600 text-white' : 'text-white/30 border border-white/10'}`}>HORIZONTAL</button>
              <button onClick={() => onChangeOrientation(patternPicker.surfaceId, pickerMat.id, 'vertical')}
                className={`px-2 py-1 rounded text-[9px] font-black ${pickerMat.tile_orientation === 'vertical' ? 'bg-amber-600 text-white' : 'text-white/30 border border-white/10'}`}>VERTICAL</button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {TILE_PATTERNS.map(p => {
              const isActive = pickerMat.pattern === p.value;
              return (
                <button key={p.value}
                  onClick={() => { onChangePattern(patternPicker.surfaceId, pickerMat.id, p.value); }}
                  className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${isActive ? 'border-amber-400 bg-amber-400/10 scale-105' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}>
                  <PatternThumb pattern={p.value} size={64} />
                  <span className={`text-[8px] font-black mt-1 tracking-wider ${isActive ? 'text-amber-400' : 'text-white/60'}`}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


// MEASUREMENT CANVAS
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
          <input autoFocus placeholder='e.g. 72"' value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { onLinesChange(lines.map(l => l.id === editingId ? { ...l, measurement: inputVal } : l)); setEditingId(null); } }} className="px-3 py-1.5 rounded border-2 border-gray-300 text-gray-900 text-sm w-28 focus:outline-none focus:border-red-500" data-testid="measurement-input" />
          <button onClick={() => { onLinesChange(lines.map(l => l.id === editingId ? { ...l, measurement: inputVal } : l)); setEditingId(null); }} className="px-3 py-1.5 rounded text-xs font-bold text-white bg-green-600">OK</button>
          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded text-xs text-gray-500">Skip</button>
        </div>
      )}
    </div>
  );
};


// MAIN COMPONENT
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
  const [cropModal, setCropModal] = useState(null);
  const pendingPlaceRef = useRef(null);

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

  const findExistingCropForItem = (itemId) => {
    if (!activeSchedule) return null;
    for (const surface of activeSchedule.surfaces) {
      for (const mat of surface.materials) {
        if (mat.item_id === itemId && mat.tile_crop && mat.tile_crop.w > 0) return mat.tile_crop;
      }
    }
    return null;
  };

  const handlePlaceRequest = (surfaceId, zoneId, item) => {
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
    if (!activeSchedule) return;
    const updatedSurfaces = activeSchedule.surfaces.map(s => {
      if (s.id !== surfaceId) return s;
      const filtered = s.materials.filter(m => m.position_label !== zoneId);
      return { ...s, materials: [...filtered, {
        id: crypto.randomUUID(), item_id: item.id, name: item.name || '', vendor: item.vendor || '',
        sku: item.sku || '', size: item.size || '', color: item.finish_color || item.color || '',
        image: item._img || '', link: item.link || '', position_label: zoneId, pattern: '',
        tile_crop: tileCrop, grout_color: '#4a4035', tile_orientation: 'horizontal',
      }] };
    });
    const updated = { ...activeSchedule, surfaces: updatedSurfaces };
    setActiveSchedule(updated); debouncedSave(updated);
  };

  const handleCropConfirm = (crop) => {
    if (cropModal?.mode === 'place' && pendingPlaceRef.current) {
      const { surfaceId, zoneId, item } = pendingPlaceRef.current;
      placeItemWithCrop(surfaceId, zoneId, item, crop);
      pendingPlaceRef.current = null;
    } else if (cropModal?.mode === 'edit' && cropModal.surfaceId && cropModal.materialId) {
      updateMaterialField(cropModal.surfaceId, cropModal.materialId, 'tile_crop', crop);
    }
    setCropModal(null);
  };

  const handleCropCancel = () => { pendingPlaceRef.current = null; setCropModal(null); };

  const updateMaterialField = (surfaceId, materialId, field, value) => {
    if (!activeSchedule) return;
    const updatedSurfaces = activeSchedule.surfaces.map(s => {
      if (s.id !== surfaceId) return s;
      return { ...s, materials: s.materials.map(m => m.id === materialId ? { ...m, [field]: value } : m) };
    });
    const updated = { ...activeSchedule, surfaces: updatedSurfaces };
    setActiveSchedule(updated); debouncedSave(updated);
  };

  const handleCropTile = (surfaceId, materialId, imageUrl, existingCrop) => {
    setCropModal({ surfaceId, materialId, imageUrl, existingCrop: existingCrop || null, mode: 'edit' });
  };

  const removeMaterial = (surfaceId, materialId) => {
    if (!activeSchedule) return;
    const updatedSurfaces = activeSchedule.surfaces.map(s =>
      s.id === surfaceId ? { ...s, materials: s.materials.filter(m => m.id !== materialId) } : s
    );
    const updated = { ...activeSchedule, surfaces: updatedSurfaces };
    setActiveSchedule(updated); debouncedSave(updated);
  };

  const changePattern = (surfaceId, materialId, pattern) => updateMaterialField(surfaceId, materialId, 'pattern', pattern);
  const changeGrout = (surfaceId, materialId, color) => updateMaterialField(surfaceId, materialId, 'grout_color', color);
  const changeOrientation = (surfaceId, materialId, orientation) => updateMaterialField(surfaceId, materialId, 'tile_orientation', orientation);

  const addSurface = () => {
    if (!activeSchedule) return;
    const name = prompt('Wall name (e.g. "Back Wall", "Left Wall", "Right Wall"):');
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
    <div data-testid="room-finish-schedule" style={{ background: '#1a1a24' }} className="rounded-xl">
      {cropModal && <TileCropModal imageUrl={cropModal.imageUrl} existingCrop={cropModal.existingCrop} onConfirm={handleCropConfirm} onCancel={handleCropCancel} />}

      {/* MATERIAL PALETTE */}
      <div className="p-4 border-b border-white/10" style={{ background: 'linear-gradient(180deg, #222230 0%, #1a1a24 100%)' }}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-lg font-black text-white">{roomName} — Finish Schedule</h3>
            <div className="text-xs text-amber-400/80 font-bold mt-0.5">
              {selectedItem ? <span className="text-green-400 animate-pulse">SELECTED: {selectedItem.name} — click a zone on the wall to place</span> : 'Click a tile below to select, then click a zone on the 3D shower to place it.'}
            </div>
          </div>
          <div className="flex gap-2">
            {selectedItem && <button onClick={() => setSelectedItem(null)} className="px-3 py-1.5 rounded text-xs font-bold text-red-400 border border-red-400/30"><X size={12} className="inline mr-1" />DESELECT</button>}
            {onClose && <button onClick={onClose} className="px-3 py-1.5 rounded text-xs text-white/40 border border-white/10"><X size={14} /></button>}
          </div>
        </div>
        {roomItems.length === 0 ? (
          <div className="text-white/20 text-sm py-4 text-center">No items — add items via Checklist or FFE first</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {itemsWithImages.map(item => (
              <button key={item.id} data-testid={`palette-item-${item.id}`}
                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                className={`flex-shrink-0 rounded-lg overflow-hidden transition-all w-28 ${selectedItem?.id === item.id ? 'ring-3 ring-green-400 scale-105' : 'ring-1 ring-white/10 hover:ring-white/30'}`}>
                <img src={item._img} alt={item.name} className="w-full h-24 object-cover" />
                <div className="p-1.5" style={{ background: '#111' }}>
                  <div className="text-white text-[9px] font-black truncate">{item.name}</div>
                  <div className="text-white/40 text-[8px] truncate">{item.vendor} {item.size ? `| ${item.size}` : ''}</div>
                </div>
              </button>
            ))}
            {itemsNoImages.map(item => (
              <button key={item.id} data-testid={`palette-item-${item.id}`}
                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                className={`flex-shrink-0 rounded-lg overflow-hidden transition-all w-28 ${selectedItem?.id === item.id ? 'ring-3 ring-green-400 scale-105' : 'ring-1 ring-white/5'}`}>
                <div className="w-full h-24 bg-[#111] flex items-center justify-center"><span className="text-white/10 text-[9px] text-center px-1">{item.name}</span></div>
                <div className="p-1.5" style={{ background: '#111' }}><div className="text-white/40 text-[8px] font-bold truncate">{item.name}</div></div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SCHEDULE CONTENT */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-1 overflow-x-auto">
            {schedules.map(s => (
              <button key={s.id} onClick={() => setActiveSchedule(s)} className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap ${activeSchedule?.id === s.id ? 'bg-amber-600 text-white' : 'text-white/30 border border-white/10'}`}>{s.name}</button>
            ))}
          </div>
          <div className="flex gap-1">
            <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 rounded text-xs font-bold text-white bg-amber-700" data-testid="create-schedule-btn"><Plus size={12} className="inline mr-1" />NEW</button>
            {activeSchedule && <>
              <button onClick={() => setShowMeasurements(!showMeasurements)} className={`px-2 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 ${showMeasurements ? 'bg-red-600 text-white' : 'text-white/30 border border-white/10'}`} data-testid="toggle-measurements-btn"><Ruler size={10} />DIMS</button>
              <button onClick={addSurface} className="px-2 py-1.5 rounded text-[10px] font-bold text-white bg-blue-700" data-testid="add-surface-btn"><Plus size={10} /> WALL</button>
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

            {!selectedItem && <div className="mb-3 text-center text-white/20 text-xs font-bold">Select a tile from the palette above, then click a zone on the shower walls to place it</div>}

            {/* 3D SHOWER VIEW */}
            <Shower3DView
              surfaces={activeSchedule.surfaces}
              selectedItem={selectedItem}
              onPlaceItem={handlePlaceRequest}
              onRemoveMaterial={removeMaterial}
              onChangePattern={changePattern}
              onCropTile={handleCropTile}
              onChangeGrout={changeGrout}
              onChangeOrientation={changeOrientation}
            />

            {/* Surface management */}
            <div className="mt-3 flex gap-1 flex-wrap">
              {activeSchedule.surfaces.map(s => (
                <span key={s.id} className="px-2 py-1 rounded text-[9px] font-bold text-white/40 bg-white/5 flex items-center gap-1">
                  {s.name}
                  <button onClick={() => removeSurface(s.id)} className="text-white/20 hover:text-red-400"><X size={10} /></button>
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

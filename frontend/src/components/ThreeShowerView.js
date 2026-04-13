import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);
const W = 5, H = 8, D = 4;
const proxyUrl = (url) => url ? `${API_URL}/api/proxy-image?url=${encodeURIComponent(url)}` : null;

/* ---- Captures Three.js internals for raycasting on drag-and-drop ---- */
function SceneRefCapture({ sceneRefObj }) {
  const { camera, scene, gl } = useThree();
  useEffect(() => {
    sceneRefObj.current = { camera, scene, gl };
  }, [camera, scene, gl, sceneRefObj]);
  return null;
}

/* ---- Texture loader with grout lines and pattern support ---- */
function useImageTexture(imageUrl, mode = 'sheet', repeatX = 3, wallW = 5, wallH = 8, pattern = 'stacked_horizontal', groutColor = '#4a4035') {
  const [texture, setTexture] = useState(null);
  useEffect(() => {
    if (!imageUrl) { setTexture(null); return; }
    let cancelled = false;
    fetch(proxyUrl(imageUrl))
      .then(r => { if (!r.ok) throw new Error('fail'); return r.blob(); })
      .then(blob => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }))
      .then(dataUrl => new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      }))
      .then(img => {
        if (cancelled || !img) return;
        const tw = img.width, th = img.height;
        // Grout thickness: 3% of shorter tile dimension
        const g = Math.max(2, Math.round(Math.min(tw, th) * 0.03));

        let sourceCanvas = null;
        let tilesPerRow = 1;

        if (mode !== 'full') {
          sourceCanvas = document.createElement('canvas');
          const c = sourceCanvas.getContext('2d');

          switch (pattern) {
            case 'offset': {
              // Brick/offset: 2 cols x 2 rows, row 2 shifted by half
              sourceCanvas.width = (tw + g) * 2;
              sourceCanvas.height = (th + g) * 2;
              c.fillStyle = groutColor;
              c.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
              // Row 1
              c.drawImage(img, 0, 0);
              c.drawImage(img, tw + g, 0);
              // Row 2 offset by half tile+grout
              const ox = Math.round((tw + g) / 2);
              for (let i = -1; i <= 2; i++) c.drawImage(img, ox + i * (tw + g), th + g);
              tilesPerRow = 2;
              break;
            }
            case 'one_third_offset': {
              // 1/3 offset: 3 rows each shifted by 1/3
              sourceCanvas.width = (tw + g) * 3;
              sourceCanvas.height = (th + g) * 3;
              c.fillStyle = groutColor;
              c.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
              for (let row = 0; row < 3; row++) {
                const y = row * (th + g);
                const shift = Math.round(row * (tw + g) / 3);
                for (let col = -1; col <= 3; col++) c.drawImage(img, shift + col * (tw + g), y);
              }
              tilesPerRow = 3;
              break;
            }
            case 'stacked_vertical': {
              // Rotate tile 90 degrees
              sourceCanvas.width = th + g;
              sourceCanvas.height = tw + g;
              c.fillStyle = groutColor;
              c.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
              c.save();
              c.translate(th / 2, tw / 2);
              c.rotate(Math.PI / 2);
              c.drawImage(img, -tw / 2, -th / 2);
              c.restore();
              tilesPerRow = 1;
              break;
            }
            case 'herringbone': {
              // V-shape herringbone pattern
              const longSide = Math.max(tw, th);
              const shortSide = Math.min(tw, th);
              const cSize = (longSide + g) * 4;
              sourceCanvas.width = cSize;
              sourceCanvas.height = cSize;
              c.fillStyle = groutColor;
              c.fillRect(0, 0, cSize, cSize);
              const tW = longSide * 0.8, tH = shortSide * 0.35;
              for (let row = -2; row < cSize / tH + 2; row++) {
                for (let col = -2; col < cSize / tW + 2; col++) {
                  const x = col * (tW + g), y = row * (tH + g) * 2;
                  c.save();
                  c.translate(x, y + (col % 2) * (tH + g));
                  c.drawImage(img, 0, 0, tw, th, 0, 0, tW, tH);
                  c.translate(tW + g, 0);
                  c.scale(-1, 1);
                  c.drawImage(img, 0, 0, tw, th, -tW, tH + g, tW, tH);
                  c.restore();
                }
              }
              tilesPerRow = Math.round(cSize / (tW + g));
              break;
            }
            case 'basket_weave': {
              // Alternating horizontal/vertical tile pairs
              sourceCanvas.width = (tw + g) * 4;
              sourceCanvas.height = (th + g) * 4;
              c.fillStyle = groutColor;
              c.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
              for (let gy = 0; gy < 4; gy++) {
                for (let gx = 0; gx < 4; gx++) {
                  const bx = gx * (tw + g), by = gy * (th + g);
                  if ((gx + gy) % 2 === 0) {
                    c.drawImage(img, 0, 0, tw, th, bx, by, tw, th / 2 - g / 2);
                    c.drawImage(img, 0, 0, tw, th, bx, by + th / 2 + g / 2, tw, th / 2 - g / 2);
                  } else {
                    c.save();
                    c.translate(bx + tw / 2, by + th / 2);
                    c.rotate(Math.PI / 2);
                    c.drawImage(img, -tw / 2, -th / 2);
                    c.restore();
                  }
                }
              }
              tilesPerRow = 4;
              break;
            }
            case 'stacked_horizontal':
            default: {
              // Simple grid with grout lines
              sourceCanvas.width = tw + g;
              sourceCanvas.height = th + g;
              c.fillStyle = groutColor;
              c.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
              c.drawImage(img, 0, 0);
              tilesPerRow = 1;
              break;
            }
          }
        }

        const src = sourceCanvas || img;
        const tex = new THREE.Texture(src);
        tex.colorSpace = THREE.SRGBColorSpace;

        if (mode === 'full') {
          tex.wrapS = THREE.ClampToEdgeWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.repeat.set(1, 1);
        } else {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          const cw = src.width, ch = src.height;
          const rx = repeatX / tilesPerRow;
          const ry = rx * (wallH / wallW) * (cw / ch);
          tex.repeat.set(rx, ry);
        }
        tex.needsUpdate = true;
        setTexture(tex);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [imageUrl, mode, repeatX, wallW, wallH, pattern, groutColor]);
  return texture;
}

/* ---- Extract material info from surface ---- */
function getSurfaceMaterial(surface) {
  if (!surface) return null;
  const mats = surface.materials || [];
  return mats.find(m => m.position_label === 'main_wall' && m.image)
    || mats.find(m => m.position_label === '_surface' && m.image)
    || mats.find(m => m.image)
    || null;
}

function getZoneMaterial(surface, zoneId) {
  if (!surface) return null;
  const mats = surface.materials || [];
  return mats.find(m => m.position_label === zoneId && m.image)
    || mats.find(m => m.position_label === 'main_wall' && m.image)
    || null;
}

/* ---- Textured Wall: meshBasicMaterial for textures (pure pixel color), meshStandardMaterial for plain ---- */
const TexturedWall = ({ position, rotation, size, imageUrl, color = '#444', mode = 'sheet', repeatX, pattern = 'stacked_horizontal', groutColor = '#4a4035', name }) => {
  const texture = useImageTexture(imageUrl, mode, repeatX, size[0], size[1], pattern, groutColor);
  return (
    <mesh position={position} rotation={rotation} name={name}>
      <planeGeometry args={size} />
      {texture ? (
        <meshBasicMaterial key={`t-${texture.id}`} map={texture} color="#ffffff" side={THREE.FrontSide} />
      ) : (
        <meshStandardMaterial key="plain" color={color} side={THREE.FrontSide} roughness={0.85} metalness={0.02} />
      )}
    </mesh>
  );
};

/* ---- Multi-zone wall (supports wainscoting) ---- */
const ZonedWall = ({ position, rotation, totalSize, surface, defaultColor = '#3a3a3a', repeatX = 3.5, name }) => {
  const zones = surface?.zone_config || [{ id: 'main_wall', height: 100 }];
  const totalW = totalSize[0], totalH = totalSize[1];
  const mainMat = getZoneMaterial(surface, 'main_wall');

  return (
    <group position={position} rotation={rotation} name={name}>
      {zones.map((zone, i) => {
        const mat = getZoneMaterial(surface, zone.id) || mainMat;
        const zoneH = totalH * (zone.height / 100);
        let accTop = 0;
        for (let j = 0; j < i; j++) accTop += zones[j].height;
        const yCenter = totalH / 2 - (accTop + zone.height / 2) / 100 * totalH;

        return (
          <TexturedWall
            key={zone.id}
            position={[0, yCenter, 0]}
            rotation={[0, 0, 0]}
            size={[totalW, zoneH]}
            imageUrl={mat?.image || null}
            color={defaultColor}
            mode={mat?.display_mode || 'sheet'}
            repeatX={repeatX}
            pattern={mat?.pattern || 'stacked_horizontal'}
            groutColor={mat?.grout_color || '#4a4035'}
          />
        );
      })}
      {/* Trim lines between zones — visible metallic strip */}
      {zones.length > 1 && zones.slice(0, -1).map((zone, i) => {
        let accTop = 0;
        for (let j = 0; j <= i; j++) accTop += zones[j].height;
        const yPos = totalH / 2 - (accTop / 100) * totalH;
        return (
          <mesh key={`trim-${i}`} position={[0, yPos, 0.01]}>
            <planeGeometry args={[totalW, 0.06]} />
            <meshBasicMaterial color="#b0b0b0" />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---- Niche ---- */
const Niche = ({ position, nicheW = 1.2, nicheH = 0.9, nicheD = 0.35, wallImg }) => {
  const texture = useImageTexture(wallImg, 'sheet', 1.5, 1);
  return (
    <group position={position}>
      <mesh position={[0, 0, nicheD / 2]}>
        <boxGeometry args={[nicheW, nicheH, nicheD]} />
        <meshStandardMaterial color="#080808" side={THREE.BackSide} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, nicheD - 0.01]}>
        <planeGeometry args={[nicheW - 0.04, nicheH - 0.04]} />
        {texture ? (
          <meshBasicMaterial map={texture} color="#ffffff" side={THREE.FrontSide} />
        ) : (
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} side={THREE.FrontSide} />
        )}
      </mesh>
      <mesh position={[0, nicheH / 2, nicheD / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[nicheW, nicheD]} />
        <meshStandardMaterial color="#111" roughness={0.95} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, -nicheH / 2 + 0.01, nicheD / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[nicheW, nicheD]} />
        {texture ? (
          <meshBasicMaterial map={texture} color="#ffffff" side={THREE.FrontSide} />
        ) : (
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} side={THREE.FrontSide} />
        )}
      </mesh>
    </group>
  );
};

/* ---- Marble Bench ---- */
const Bench = ({ benchW = 1, benchH = 1.8, benchD = D * 0.85, side = 'right' }) => {
  const x = side === 'right' ? W / 2 - benchW / 2 : -W / 2 + benchW / 2;
  return (
    <group position={[x, benchH / 2, -D / 2 + benchD / 2]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[benchW, benchH, benchD]} />
        <meshStandardMaterial color="#e8e0d8" roughness={0.3} metalness={0.05} />
      </mesh>
      <mesh position={[0, benchH / 2 + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[benchW, benchD]} />
        <meshStandardMaterial color="#f0ece6" roughness={0.2} metalness={0.02} />
      </mesh>
    </group>
  );
};

/* ---- Gold Fixtures ---- */
const goldMat = { color: '#c8a84e', roughness: 0.25, metalness: 0.85 };

const RainHead = ({ position }) => (
  <group position={position}>
    <mesh><cylinderGeometry args={[0.02, 0.02, 0.6, 8]} /><meshStandardMaterial {...goldMat} /></mesh>
    <mesh position={[0, -0.35, 0]}><cylinderGeometry args={[0.2, 0.22, 0.06, 24]} /><meshStandardMaterial {...goldMat} /></mesh>
  </group>
);

const WallHead = ({ position }) => (
  <group position={position}>
    <mesh rotation={[0, 0, Math.PI / 6]}><cylinderGeometry args={[0.02, 0.02, 0.5, 8]} /><meshStandardMaterial {...goldMat} /></mesh>
    <mesh position={[0.2, 0.15, 0]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial {...goldMat} /></mesh>
  </group>
);

const HandShower = ({ position }) => (
  <group position={position}>
    <mesh><cylinderGeometry args={[0.015, 0.015, 2.2, 8]} /><meshStandardMaterial {...goldMat} /></mesh>
    <mesh position={[0, 1.0, 0.03]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial {...goldMat} /></mesh>
    <mesh position={[0, -1.0, 0.03]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial {...goldMat} /></mesh>
    <mesh position={[0, 0.3, 0.08]}><cylinderGeometry args={[0.06, 0.05, 0.15, 12]} /><meshStandardMaterial {...goldMat} /></mesh>
  </group>
);

const ValveTrim = ({ position }) => (
  <group position={position}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.1, 0.1, 0.03, 24]} /><meshStandardMaterial {...goldMat} /></mesh>
    <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.08, 12]} /><meshStandardMaterial {...goldMat} /></mesh>
  </group>
);

const FloorDrain = ({ position }) => (
  <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.06, 0.06, 0.01, 16]} /><meshStandardMaterial {...goldMat} /></mesh>
);

/* ---- Scene ---- */
const Scene = ({ schedule, sceneRef }) => {
  const surfaces = schedule?.surfaces || [];
  const walls = surfaces.filter(s => s.surface_type === 'wall');
  const ceiling = surfaces.find(s => s.surface_type === 'ceiling');
  const floor = surfaces.find(s => s.surface_type === 'floor');

  const backWall = walls.find(s => s.name?.toLowerCase().includes('back')) || walls[0];
  const leftWall = walls.find(s => s.name?.toLowerCase().includes('left')) || walls[1];
  const rightWall = walls.find(s => s.name?.toLowerCase().includes('right')) || walls[2];

  const backImg = getSurfaceMaterial(backWall)?.image;
  const floorMat = getSurfaceMaterial(floor);
  const ceilMat = getSurfaceMaterial(ceiling);

  const backBenches = backWall?.benches || [];
  const backNiches = backWall?.niches || [];

  return (
    <>
      <SceneRefCapture sceneRefObj={sceneRef} />

      {/* Lighting — bright ambient so meshBasicMaterial textures look natural, fixtures get PBR shine */}
      <ambientLight intensity={0.9} color="#ffffff" />
      <pointLight position={[0, H - 0.2, D * 0.2]} intensity={1.2} distance={20} decay={2} color="#ffffff" />
      <directionalLight position={[1.5, H, 3]} intensity={0.5} color="#ffffff" />

      {/* Back wall — zoned (supports wainscoting) */}
      <ZonedWall position={[0, H / 2, -D / 2]} rotation={[0, 0, 0]}
        totalSize={[W, H]} surface={backWall} defaultColor="#3a3a3a" repeatX={3.5} name="back_wall" />

      {/* Left wall — zoned */}
      <ZonedWall position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]}
        totalSize={[D, H]} surface={leftWall} defaultColor="#2e2e2e" repeatX={2.8} name="left_wall" />

      {/* Right wall — zoned */}
      <ZonedWall position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}
        totalSize={[D, H]} surface={rightWall} defaultColor="#2e2e2e" repeatX={2.8} name="right_wall" />

      {/* Floor — textured */}
      <TexturedWall position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}
        size={[W, D]} imageUrl={floorMat?.image} color="#4a4a4a"
        mode={floorMat?.display_mode || 'sheet'} repeatX={3}
        pattern={floorMat?.pattern || 'stacked_horizontal'}
        groutColor={floorMat?.grout_color || '#4a4035'} name="floor" />

      {/* Ceiling — textured */}
      <TexturedWall position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}
        size={[W, D]} imageUrl={ceilMat?.image} color="#c5c0b8"
        mode={ceilMat?.display_mode || 'full'} repeatX={3}
        pattern={ceilMat?.pattern || 'stacked_horizontal'}
        groutColor={ceilMat?.grout_color || '#4a4035'} name="ceiling" />

      {/* Niches — FIXED: use n.x not n.x_pct */}
      {backNiches.length > 0 ? (
        backNiches.map((n, i) => {
          const nx = ((n.x ?? n.x_pct ?? 35) / 100 - 0.5) * W;
          const ny = H - ((n.y ?? n.y_pct ?? 30) / 100) * H - ((n.h ?? n.h_pct ?? 25) / 100) * H / 2;
          const nw = ((n.w ?? n.w_pct ?? 30) / 100) * W;
          const nh = ((n.h ?? n.h_pct ?? 25) / 100) * H;
          return <Niche key={n.id || i} position={[nx, ny, -D / 2 + 0.05]} nicheW={Math.max(0.3, nw)} nicheH={Math.max(0.3, nh)} wallImg={backImg} />;
        })
      ) : (
        <Niche position={[0, H * 0.58, -D / 2 + 0.05]} nicheW={1.3} nicheH={0.9} wallImg={backImg} />
      )}

      {/* Benches — FIXED: use b.w not b.w_pct */}
      {backBenches.length > 0 ? (
        backBenches.map((b, i) => {
          const bw = ((b.w ?? b.w_pct ?? 20) / 100) * W;
          const bh = ((b.h ?? b.h_pct ?? 22) / 100) * H;
          const bx = (b.x ?? b.x_pct ?? 60);
          return <Bench key={b.id || i} benchW={Math.max(0.5, bw)} benchH={Math.max(0.5, bh)} side={bx > 50 ? 'right' : 'left'} />;
        })
      ) : (
        <Bench />
      )}

      {/* Gold Fixtures */}
      <RainHead position={[0, H - 0.05, -D / 2 + 0.15]} />
      <WallHead position={[-W / 2 + 0.15, H * 0.75, -D * 0.15]} />
      <HandShower position={[-W / 2 + 0.15, H * 0.55, -D * 0.15]} />
      <ValveTrim position={[W / 2 - 0.08, H * 0.5, 0]} />
      <FloorDrain position={[0, 0.02, 0.3]} />

      {/* Corner shadows */}
      {[[-W/2+0.01, -D/2+0.01, 0.5], [W/2-0.01, -D/2+0.01, 0.5], [-W/2+0.01, D/2-0.01, 0.2], [W/2-0.01, D/2-0.01, 0.2]].map(([x, z, op], i) => (
        <mesh key={`c${i}`} position={[x, H/2, z]}>
          <boxGeometry args={[0.04, H, 0.04]} />
          <meshBasicMaterial color="#000" transparent opacity={op} />
        </mesh>
      ))}

      <OrbitControls
        enablePan={false} enableZoom={true}
        minPolarAngle={Math.PI * 0.2} maxPolarAngle={Math.PI * 0.65}
        minAzimuthAngle={-Math.PI * 0.3} maxAzimuthAngle={Math.PI * 0.3}
        target={[0, H * 0.42, -D / 2]}
        minDistance={3} maxDistance={9}
      />
    </>
  );
};

/* ---- Main component with drag-and-drop support ---- */
const ThreeShowerView = ({ schedule, onDropTile }) => {
  const sceneRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragTimerRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
    clearTimeout(dragTimerRef.current);
    dragTimerRef.current = setTimeout(() => setIsDragOver(false), 150);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    clearTimeout(dragTimerRef.current);
    if (!onDropTile || !sceneRef.current) return;
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const item = JSON.parse(raw);
      const { camera, scene, gl } = sceneRef.current;
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const validNames = ['back_wall', 'left_wall', 'right_wall', 'floor', 'ceiling'];
      for (const hit of intersects) {
        let obj = hit.object;
        while (obj) {
          if (obj.name && validNames.includes(obj.name)) {
            onDropTile(obj.name, item);
            return;
          }
          obj = obj.parent;
        }
      }
      // Fallback: apply to back wall if drop position didn't raycast a specific wall
      onDropTile('back_wall', item);
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  return (
    <div data-testid="shower-3d-view" style={{
      width: '100%', height: '720px', borderRadius: '12px', overflow: 'hidden',
      background: '#050505', position: 'relative',
      border: isDragOver ? '3px solid #22c55e' : '2px solid #1a1a1a',
      transition: 'border-color 0.15s',
    }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}>

      {/* Drop overlay */}
      {isDragOver && (
        <div data-testid="drop-overlay" style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(34, 197, 94, 0.06)', zIndex: 10, pointerEvents: 'none', borderRadius: '12px',
        }}>
          <span style={{
            color: '#22c55e', fontSize: '20px', fontWeight: 900, letterSpacing: '3px',
            textShadow: '0 2px 12px rgba(0,0,0,0.9)', padding: '10px 24px', borderRadius: '8px',
            background: 'rgba(0,0,0,0.7)', border: '2px solid #22c55e',
          }}>
            DROP TILE HERE
          </span>
        </div>
      )}

      <Canvas
        camera={{ position: [0, H * 0.48, D * 1.15], fov: 52 }}
        frameloop="always"
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        onCreated={({ gl }) => { gl.setClearColor('#050505'); }}
      >
        <Scene schedule={schedule} sceneRef={sceneRef} />
      </Canvas>
    </div>
  );
};

export default ThreeShowerView;

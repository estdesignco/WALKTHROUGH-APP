import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);
const W = 5, H = 8, D = 4;
const proxyUrl = (url) => url ? `${API_URL}/api/proxy-image?url=${encodeURIComponent(url)}` : null;

/* ---- Texture loader ---- */
function useImageTexture(imageUrl, mode = 'sheet', repeatX = 3, wallW = 5, wallH = 8, pattern = 'stacked_horizontal') {
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
      .then(dataUrl => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      }))
      .then(img => {
        if (cancelled || !img) return;

        let sourceCanvas;
        const imgW = img.width, imgH = img.height;

        if (mode !== 'full' && pattern === 'offset') {
          // Brick/offset: every other row shifted by half
          sourceCanvas = document.createElement('canvas');
          sourceCanvas.width = imgW * 2; sourceCanvas.height = imgH * 2;
          const p = sourceCanvas.getContext('2d');
          p.drawImage(img, 0, 0); p.drawImage(img, imgW, 0);
          p.drawImage(img, -imgW / 2, imgH); p.drawImage(img, imgW / 2, imgH); p.drawImage(img, imgW * 1.5, imgH);
        } else if (mode !== 'full' && pattern === 'one_third_offset') {
          // 1/3 offset: each row shifted by 1/3
          sourceCanvas = document.createElement('canvas');
          sourceCanvas.width = imgW * 3; sourceCanvas.height = imgH * 3;
          const p = sourceCanvas.getContext('2d');
          for (let c = 0; c < 4; c++) p.drawImage(img, c * imgW, 0);
          for (let c = -1; c < 4; c++) p.drawImage(img, c * imgW + imgW / 3, imgH);
          for (let c = -1; c < 4; c++) p.drawImage(img, c * imgW + (imgW * 2 / 3), imgH * 2);
        } else if (mode !== 'full' && pattern === 'herringbone') {
          // Herringbone: V-shape pattern
          sourceCanvas = document.createElement('canvas');
          const size = Math.max(imgW, imgH) * 4;
          sourceCanvas.width = size; sourceCanvas.height = size;
          const p = sourceCanvas.getContext('2d');
          const tw = imgW * 0.8, th = imgH * 0.3;
          for (let row = -2; row < size / th + 2; row++) {
            for (let col = -2; col < size / tw + 2; col++) {
              const x = col * tw, y = row * th * 2;
              p.save(); p.translate(x, y + (col % 2) * th);
              p.drawImage(img, 0, 0, imgW, imgH, 0, 0, tw, th);
              p.translate(tw, 0); p.scale(-1, 1); p.drawImage(img, 0, 0, imgW, imgH, -tw, th, tw, th);
              p.restore();
            }
          }
        } else if (mode !== 'full' && pattern === 'basket_weave') {
          // Basket weave: alternating horizontal/vertical pairs
          sourceCanvas = document.createElement('canvas');
          sourceCanvas.width = imgW * 4; sourceCanvas.height = imgH * 4;
          const p = sourceCanvas.getContext('2d');
          for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 4; gx++) {
            const bx = gx * imgW, by = gy * imgH;
            if ((gx + gy) % 2 === 0) {
              p.drawImage(img, 0, 0, imgW, imgH, bx, by, imgW, imgH / 2);
              p.drawImage(img, 0, 0, imgW, imgH, bx, by + imgH / 2, imgW, imgH / 2);
            } else {
              p.save(); p.translate(bx + imgW / 2, by + imgH / 2); p.rotate(Math.PI / 2);
              p.drawImage(img, 0, 0, imgW, imgH, -imgH / 2, -imgW / 2, imgH, imgW);
              p.restore();
            }
          }
        } else if (mode !== 'full' && pattern === 'stacked_vertical') {
          sourceCanvas = document.createElement('canvas');
          sourceCanvas.width = imgH; sourceCanvas.height = imgW;
          const p = sourceCanvas.getContext('2d');
          p.translate(imgH / 2, imgW / 2); p.rotate(Math.PI / 2);
          p.drawImage(img, -imgW / 2, -imgH / 2);
        }

        const texSource = sourceCanvas || img;
        const tex = new THREE.Texture(texSource);
        tex.colorSpace = THREE.SRGBColorSpace;

        if (mode === 'full') {
          tex.wrapS = THREE.ClampToEdgeWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.repeat.set(1, 1);
        } else {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          const srcW = texSource.width || imgW;
          const srcH = texSource.height || imgH;
          const imgAspect = srcW / srcH;
          const rx = pattern === 'offset' ? repeatX / 2 : repeatX;
          const ry = rx * (wallH / wallW) * imgAspect;
          tex.repeat.set(rx, ry);
        }
        tex.needsUpdate = true;
        setTexture(tex);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [imageUrl, mode, repeatX, wallW, wallH, pattern]);
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

/* ---- Textured Wall ---- */
const TexturedWall = ({ position, rotation, size, imageUrl, color = '#444', mode = 'sheet', repeatX, pattern = 'stacked_horizontal' }) => {
  const texture = useImageTexture(imageUrl, mode, repeatX, size[0], size[1], pattern);
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial
        key={texture ? `t-${texture.id}` : 'p'}
        map={texture || undefined}
        color={texture ? '#ffffff' : color}
        side={THREE.FrontSide}
        roughness={0.75}
        metalness={0.02}
      />
    </mesh>
  );
};

/* ---- Multi-zone wall (supports wainscoting) ---- */
const ZonedWall = ({ position, rotation, totalSize, surface, defaultColor = '#3a3a3a', repeatX = 3.5 }) => {
  const zones = surface?.zone_config || [{ id: 'main_wall', height: 100 }];
  const totalW = totalSize[0], totalH = totalSize[1];
  // Get main_wall material as fallback for zones without their own material
  const mainMat = getZoneMaterial(surface, 'main_wall');

  return (
    <group position={position} rotation={rotation}>
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
          />
        );
      })}
      {/* Trim lines between zones */}
      {zones.length > 1 && zones.slice(0, -1).map((zone, i) => {
        let accTop = 0;
        for (let j = 0; j <= i; j++) accTop += zones[j].height;
        const yPos = totalH / 2 - (accTop / 100) * totalH;
        return (
          <mesh key={`trim-${i}`} position={[0, yPos, 0.005]}>
            <planeGeometry args={[totalW, 0.03]} />
            <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---- Niche ---- */
const Niche = ({ position, nicheW = 1.2, nicheH = 0.9, nicheD = 0.35, wallImg }) => {
  const texture = useImageTexture(wallImg, 'sheet', 1.5, 1);
  const matProps = texture
    ? { map: texture, color: '#999999', roughness: 0.85 }
    : { color: '#1a1a1a', roughness: 0.95 };

  return (
    <group position={position}>
      <mesh position={[0, 0, nicheD / 2]}>
        <boxGeometry args={[nicheW, nicheH, nicheD]} />
        <meshStandardMaterial color="#080808" side={THREE.BackSide} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, nicheD - 0.01]}>
        <planeGeometry args={[nicheW - 0.04, nicheH - 0.04]} />
        <meshStandardMaterial {...matProps} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, nicheH / 2, nicheD / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[nicheW, nicheD]} />
        <meshStandardMaterial color="#111" roughness={0.95} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, -nicheH / 2 + 0.01, nicheD / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[nicheW, nicheD]} />
        <meshStandardMaterial {...matProps} side={THREE.FrontSide} />
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
const Scene = ({ schedule }) => {
  const surfaces = schedule?.surfaces || [];
  const walls = surfaces.filter(s => s.surface_type === 'wall');
  const ceiling = surfaces.find(s => s.surface_type === 'ceiling');
  const floor = surfaces.find(s => s.surface_type === 'floor');
  const nicheSurfaces = surfaces.filter(s => s.surface_type === 'niche');

  const backWall = walls.find(s => s.name?.toLowerCase().includes('back')) || walls[0];
  const leftWall = walls.find(s => s.name?.toLowerCase().includes('left')) || walls[1];
  const rightWall = walls.find(s => s.name?.toLowerCase().includes('right')) || walls[2];

  const backImg = getSurfaceMaterial(backWall)?.image;
  const floorMat = getSurfaceMaterial(floor);
  const ceilMat = getSurfaceMaterial(ceiling);

  // Check for benches/niches in wall data
  const backBenches = backWall?.benches || [];
  const backNiches = backWall?.niches || [];

  return (
    <>
      {/* Lighting — bright enough for white tiles to appear white */}
      <ambientLight intensity={0.7} color="#ffffff" />
      <pointLight position={[0, H - 0.2, D * 0.2]} intensity={2.0} distance={20} decay={2} castShadow color="#ffffff" />
      <directionalLight position={[1.5, H, 3]} intensity={0.8} castShadow color="#ffffff" />
      <directionalLight position={[-2, H * 0.5, 2]} intensity={0.4} color="#ffffff" />
      <pointLight position={[0, 0.5, D * 0.5]} intensity={0.4} distance={12} color="#ffffff" />

      {/* Back wall — zoned (supports wainscoting) */}
      <ZonedWall
        position={[0, H / 2, -D / 2]}
        rotation={[0, 0, 0]}
        totalSize={[W, H]}
        surface={backWall}
        defaultColor="#3a3a3a"
        repeatX={3.5}
      />

      {/* Left wall — zoned */}
      <ZonedWall
        position={[-W / 2, H / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        totalSize={[D, H]}
        surface={leftWall}
        defaultColor="#2e2e2e"
        repeatX={2.8}
      />

      {/* Right wall — zoned */}
      <ZonedWall
        position={[W / 2, H / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        totalSize={[D, H]}
        surface={rightWall}
        defaultColor="#2e2e2e"
        repeatX={2.8}
      />

      {/* Floor */}
      <TexturedWall
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={[W, D]}
        imageUrl={floorMat?.image}
        color="#4a4a4a"
        mode={floorMat?.display_mode || 'sheet'}
        repeatX={3}
        pattern={floorMat?.pattern || 'stacked_horizontal'}
      />

      {/* Ceiling */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={ceilMat ? '#ffffff' : '#c5c0b8'} roughness={0.9} />
      </mesh>

      {/* Niche — from data or default */}
      {backNiches.length > 0 ? (
        backNiches.map((n, i) => {
          const nx = (n.x_pct / 100 - 0.5) * W;
          const ny = H - (n.y_pct / 100) * H - (n.h_pct / 100) * H / 2;
          const nw = (n.w_pct / 100) * W;
          const nh = (n.h_pct / 100) * H;
          return <Niche key={i} position={[nx, ny, -D / 2 + 0.05]} nicheW={nw} nicheH={nh} wallImg={backImg} />;
        })
      ) : (
        <Niche position={[0, H * 0.58, -D / 2 + 0.05]} nicheW={1.3} nicheH={0.9} wallImg={backImg} />
      )}

      {/* Bench — from data or default */}
      {backBenches.length > 0 ? (
        backBenches.map((b, i) => {
          const bw = ((b.w_pct || b.w || 20) / 100) * W;
          const bh = ((b.h_pct || b.h || 22) / 100) * H;
          const bx = (b.x_pct || b.x || 60);
          return <Bench key={i} benchW={Math.max(0.5, bw)} benchH={Math.max(0.5, bh)} side={bx > 50 ? 'right' : 'left'} />;
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

/* ---- Main ---- */
const ThreeShowerView = ({ schedule }) => {
  return (
    <div data-testid="shower-3d-view" style={{
      width: '100%', height: '720px', borderRadius: '12px', overflow: 'hidden',
      background: '#050505', border: '2px solid #1a1a1a',
    }}>
      <Canvas
        camera={{ position: [0, H * 0.48, D * 1.15], fov: 52 }}
        shadows
        frameloop="always"
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        onCreated={({ gl }) => { gl.setClearColor('#050505'); }}
      >
        <Scene schedule={schedule} />
      </Canvas>
    </div>
  );
};

export default ThreeShowerView;

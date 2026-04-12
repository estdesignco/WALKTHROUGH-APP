import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

// Shower dimensions matching reference ratio (~5:8:4 feet)
const W = 5, H = 8, D = 4;
const proxyUrl = (url) => url ? `${API_URL}/api/proxy-image?url=${encodeURIComponent(url)}` : null;

/* ---- Texture loader hook ---- */
function useImageTexture(imageUrl, repeatX = 3, repeatY = 2.5) {
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
        const tex = new THREE.Texture(img);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.repeat.set(repeatX, repeatY);
        tex.needsUpdate = true;
        setTexture(tex);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [imageUrl, repeatX, repeatY]);
  return texture;
}

/* ---- Textured plane ---- */
const Wall = ({ position, rotation, size, imageUrl, color = '#444', repeatX, repeatY, roughness = 0.75 }) => {
  const texture = useImageTexture(imageUrl, repeatX, repeatY);
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial
        key={texture ? `t-${texture.id}` : 'plain'}
        map={texture || undefined}
        color={texture ? '#ffffff' : color}
        side={THREE.FrontSide}
        roughness={roughness}
        metalness={0.02}
      />
    </mesh>
  );
};

/* ---- Niche (recessed box in back wall) ---- */
const Niche = ({ position, nicheW = 1.2, nicheH = 0.8, nicheD = 0.35, wallImg }) => {
  const texture = useImageTexture(wallImg, 1.5, 1);
  const matProps = texture
    ? { map: texture, color: '#888888', roughness: 0.9, metalness: 0 }
    : { color: '#1a1a1a', roughness: 0.9, metalness: 0 };

  return (
    <group position={position}>
      {/* Dark recessed box */}
      <mesh position={[0, 0, nicheD / 2]}>
        <boxGeometry args={[nicheW, nicheH, nicheD]} />
        <meshStandardMaterial color="#0a0a0a" side={THREE.BackSide} roughness={0.95} />
      </mesh>
      {/* Back face of niche */}
      <mesh position={[0, 0, nicheD - 0.01]}>
        <planeGeometry args={[nicheW - 0.04, nicheH - 0.04]} />
        <meshStandardMaterial {...matProps} side={THREE.FrontSide} />
      </mesh>
      {/* Top lip shadow */}
      <mesh position={[0, nicheH / 2, nicheD / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[nicheW, nicheD]} />
        <meshStandardMaterial color="#111" roughness={0.95} side={THREE.FrontSide} />
      </mesh>
      {/* Bottom shelf */}
      <mesh position={[0, -nicheH / 2, nicheD / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[nicheW, nicheD]} />
        <meshStandardMaterial {...matProps} side={THREE.FrontSide} />
      </mesh>
    </group>
  );
};

/* ---- Marble Bench ---- */
const Bench = ({ benchW = 1, benchH = 1.8, benchD = D * 0.85 }) => {
  return (
    <group position={[W / 2 - benchW / 2, benchH / 2, -D / 2 + benchD / 2]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[benchW, benchH, benchD]} />
        <meshStandardMaterial color="#e8e0d8" roughness={0.3} metalness={0.05} />
      </mesh>
      {/* Marble veining effect via top face */}
      <mesh position={[0, benchH / 2 + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[benchW, benchD]} />
        <meshStandardMaterial color="#f0ece6" roughness={0.25} metalness={0.02} />
      </mesh>
    </group>
  );
};

/* ---- Gold Fixture ---- */
const GoldFixture = ({ position, type = 'showerhead' }) => {
  const goldMat = { color: '#c8a84e', roughness: 0.25, metalness: 0.85 };

  if (type === 'rain') {
    return (
      <group position={position}>
        {/* Arm from ceiling */}
        <mesh><cylinderGeometry args={[0.02, 0.02, 0.6, 8]} /><meshStandardMaterial {...goldMat} /></mesh>
        {/* Head */}
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.2, 0.22, 0.06, 24]} /><meshStandardMaterial {...goldMat} />
        </mesh>
      </group>
    );
  }
  if (type === 'wall_head') {
    return (
      <group position={position}>
        {/* Arm */}
        <mesh rotation={[0, 0, Math.PI / 6]}>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} /><meshStandardMaterial {...goldMat} />
        </mesh>
        {/* Head */}
        <mesh position={[0.2, 0.15, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial {...goldMat} />
        </mesh>
      </group>
    );
  }
  if (type === 'handshower') {
    return (
      <group position={position}>
        {/* Slide bar */}
        <mesh><cylinderGeometry args={[0.015, 0.015, 2.2, 8]} /><meshStandardMaterial {...goldMat} /></mesh>
        {/* Bracket top */}
        <mesh position={[0, 1.0, 0.03]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial {...goldMat} /></mesh>
        {/* Bracket bottom */}
        <mesh position={[0, -1.0, 0.03]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial {...goldMat} /></mesh>
        {/* Handshower head */}
        <mesh position={[0, 0.3, 0.08]}>
          <cylinderGeometry args={[0.06, 0.05, 0.15, 12]} /><meshStandardMaterial {...goldMat} />
        </mesh>
      </group>
    );
  }
  if (type === 'valve') {
    return (
      <group position={position}>
        {/* Escutcheon plate */}
        <mesh><cylinderGeometry args={[0.1, 0.1, 0.03, 24]} rotation={[Math.PI / 2, 0, 0]} /><meshStandardMaterial {...goldMat} /></mesh>
        {/* Handle */}
        <mesh position={[0, 0, 0.04]}>
          <cylinderGeometry args={[0.03, 0.03, 0.08, 12]} rotation={[Math.PI / 2, 0, 0]} /><meshStandardMaterial {...goldMat} />
        </mesh>
      </group>
    );
  }
  if (type === 'drain') {
    return (
      <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.01, 16]} /><meshStandardMaterial {...goldMat} />
      </mesh>
    );
  }
  return null;
};

/* ---- Full Scene ---- */
const Scene = ({ backImg, leftImg, rightImg, floorImg, ceilingImg }) => {
  return (
    <>
      {/* Lighting — warm, atmospheric */}
      <ambientLight intensity={0.35} color="#f5f0e8" />
      <pointLight position={[0, H - 0.2, D * 0.2]} intensity={1.5} distance={18} decay={2} castShadow color="#fff5e6" />
      <directionalLight position={[1.5, H, 3]} intensity={0.5} castShadow color="#ffffff"
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-2, H * 0.3, -1]} intensity={0.12} color="#d0d5e0" />
      {/* Subtle fill from below */}
      <pointLight position={[0, 0.5, D * 0.3]} intensity={0.15} distance={10} color="#e0e0e0" />

      {/* Back wall — 14 tiles wide × 10 tall (reference) */}
      <Wall position={[0, H / 2, -D / 2]} rotation={[0, 0, 0]} size={[W, H]}
        imageUrl={backImg} color="#3a3a3a" repeatX={3.5} repeatY={2.5} />

      {/* Left wall */}
      <Wall position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} size={[D, H]}
        imageUrl={leftImg || backImg} color="#2e2e2e" repeatX={2.8} repeatY={2.5} />

      {/* Right wall */}
      <Wall position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} size={[D, H]}
        imageUrl={rightImg || backImg} color="#2e2e2e" repeatX={2.8} repeatY={2.5} />

      {/* Floor */}
      <Wall position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} size={[W, D]}
        imageUrl={floorImg} color="#4a4a4a" repeatX={3} repeatY={2.5} roughness={0.6} />

      {/* Ceiling — plain light */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={ceilingImg ? '#ffffff' : '#c5c0b8'} roughness={0.9} />
      </mesh>

      {/* Niche — centered on back wall, above middle */}
      <Niche position={[0, H * 0.58, -D / 2 + 0.01]} nicheW={1.3} nicheH={0.9} nicheD={0.35} wallImg={backImg} />

      {/* Marble Bench — right side */}
      <Bench />

      {/* Gold Fixtures */}
      <GoldFixture position={[0, H - 0.05, -D / 2 + 0.15]} type="rain" />
      <GoldFixture position={[-W / 2 + 0.15, H * 0.75, -D * 0.15]} type="wall_head" />
      <GoldFixture position={[-W / 2 + 0.15, H * 0.55, -D * 0.15]} type="handshower" />
      <GoldFixture position={[W / 2 - 0.08, H * 0.5, 0]} type="valve" />
      <GoldFixture position={[0, 0.02, 0.3]} type="drain" />

      {/* Corner ambient occlusion */}
      {[[-W/2+0.01, -D/2+0.01], [W/2-0.01, -D/2+0.01], [-W/2+0.01, D/2-0.01], [W/2-0.01, D/2-0.01]].map(([x, z], i) => (
        <mesh key={i} position={[x, H/2, z]}>
          <boxGeometry args={[0.04, H, 0.04]} />
          <meshBasicMaterial color="#000" transparent opacity={i < 2 ? 0.5 : 0.2} />
        </mesh>
      ))}

      {/* Floor-wall edge shadows */}
      {[[-D/2+0.02, [W, 0.04, 0.04]], [D/2-0.02, [W, 0.04, 0.04]]].map(([z, args], i) => (
        <mesh key={`fw${i}`} position={[0, 0.02, z]}>
          <boxGeometry args={args} />
          <meshBasicMaterial color="#000" transparent opacity={0.25} />
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

/* ---- Main Component ---- */
const ThreeShowerView = ({ schedule }) => {
  const surfaces = schedule?.surfaces || [];
  const walls = surfaces.filter(s => s.surface_type === 'wall');
  const ceiling = surfaces.find(s => s.surface_type === 'ceiling');
  const floor = surfaces.find(s => s.surface_type === 'floor');
  const backWall = walls.find(s => s.name?.toLowerCase().includes('back')) || walls[0];
  const leftWall = walls.find(s => s.name?.toLowerCase().includes('left')) || walls[1];
  const rightWall = walls.find(s => s.name?.toLowerCase().includes('right')) || walls[2];
  const getImg = (surface) => {
    if (!surface) return null;
    const mats = surface.materials || [];
    // Prefer main_wall zone material (the primary tile the user placed)
    const mainMat = mats.find(m => m.position_label === 'main_wall' && m.image);
    if (mainMat) return mainMat.image;
    // Then try _surface (for floor/ceiling)
    const surfMat = mats.find(m => m.position_label === '_surface' && m.image);
    if (surfMat) return surfMat.image;
    // Fallback to any material with image
    for (const m of mats) { if (m.image) return m.image; }
    return null;
  };

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
        <Scene
          backImg={getImg(backWall)}
          leftImg={getImg(leftWall)}
          rightImg={getImg(rightWall)}
          floorImg={getImg(floor)}
          ceilingImg={getImg(ceiling)}
        />
      </Canvas>
    </div>
  );
};

export default ThreeShowerView;

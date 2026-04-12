import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);
const W = 5, H = 8, D = 4;
const proxyUrl = (url) => url ? `${API_URL}/api/proxy-image?url=${encodeURIComponent(url)}` : null;

/* Load a texture from URL via fetch → blob → dataURL → Image → THREE.Texture */
function useImageTexture(imageUrl, repeatX = 6, repeatY = 4) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!imageUrl) { setTexture(null); return; }
    let cancelled = false;
    const src = proxyUrl(imageUrl);

    fetch(src)
      .then(r => { if (!r.ok) throw new Error('Proxy failed'); return r.blob(); })
      .then(blob => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }))
      .then(dataUrl => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
      }))
      .then(img => {
        if (cancelled) return;
        const tex = new THREE.Texture(img);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.repeat.set(repeatX, repeatY);
        tex.needsUpdate = true;
        setTexture(tex);
      })
      .catch(() => {
        // Fallback: try loading image directly
        if (cancelled) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (cancelled) return;
          const tex = new THREE.Texture(img);
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.repeat.set(repeatX, repeatY);
          tex.needsUpdate = true;
          setTexture(tex);
        };
        img.src = imageUrl;
      });

    return () => { cancelled = true; };
  }, [imageUrl, repeatX, repeatY]);

  return texture;
}

/* Wall mesh with texture */
const Wall = ({ position, rotation, size, imageUrl, color = '#444', repeatX, repeatY }) => {
  const aspect = size[0] / size[1];
  const rx = repeatX || Math.round(size[0] * 1.5);
  const ry = repeatY || Math.round(rx / aspect);
  const texture = useImageTexture(imageUrl, rx, ry);

  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial
        key={texture ? `tex-${texture.id}` : 'no-tex'}
        map={texture || undefined}
        color={texture ? '#ffffff' : color}
        side={THREE.FrontSide}
        roughness={0.8}
        metalness={0.05}
      />
    </mesh>
  );
};

/* Scene with all walls + lighting */
const Scene = ({ backImg, leftImg, rightImg, floorImg, ceilingImg }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, H - 0.3, D * 0.3]} intensity={1.2} distance={20} decay={2} castShadow />
      <directionalLight position={[2, H, 4]} intensity={0.4} />
      <directionalLight position={[-1, H * 0.4, -1]} intensity={0.15} />

      {/* Back wall */}
      <Wall position={[0, H / 2, -D / 2]} rotation={[0, 0, 0]} size={[W, H]}
        imageUrl={backImg} color="#3a3a3a" repeatX={8} repeatY={6} />

      {/* Left wall */}
      <Wall position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} size={[D, H]}
        imageUrl={leftImg || backImg} color="#333" repeatX={6} repeatY={6} />

      {/* Right wall */}
      <Wall position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} size={[D, H]}
        imageUrl={rightImg || backImg} color="#333" repeatX={6} repeatY={6} />

      {/* Floor */}
      <Wall position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} size={[W, D]}
        imageUrl={floorImg} color="#555" repeatX={6} repeatY={5} />

      {/* Ceiling */}
      <Wall position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} size={[W, D]}
        imageUrl={ceilingImg} color="#ccc" repeatX={4} repeatY={3} />

      {/* Corner ambient occlusion lines */}
      <mesh position={[-W / 2 + 0.01, H / 2, -D / 2 + 0.01]}>
        <boxGeometry args={[0.03, H, 0.03]} />
        <meshBasicMaterial color="#000" transparent opacity={0.4} />
      </mesh>
      <mesh position={[W / 2 - 0.01, H / 2, -D / 2 + 0.01]}>
        <boxGeometry args={[0.03, H, 0.03]} />
        <meshBasicMaterial color="#000" transparent opacity={0.4} />
      </mesh>
      <mesh position={[-W / 2 + 0.01, H / 2, D / 2 - 0.01]}>
        <boxGeometry args={[0.03, H, 0.03]} />
        <meshBasicMaterial color="#000" transparent opacity={0.15} />
      </mesh>
      <mesh position={[W / 2 - 0.01, H / 2, D / 2 - 0.01]}>
        <boxGeometry args={[0.03, H, 0.03]} />
        <meshBasicMaterial color="#000" transparent opacity={0.15} />
      </mesh>

      <OrbitControls
        enablePan={false} enableZoom={true}
        minPolarAngle={Math.PI * 0.2} maxPolarAngle={Math.PI * 0.7}
        minAzimuthAngle={-Math.PI * 0.35} maxAzimuthAngle={Math.PI * 0.35}
        target={[0, H * 0.45, -D / 2]}
        minDistance={2.5} maxDistance={9}
      />
    </>
  );
};

/* Main component */
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
    for (const m of (surface.materials || [])) { if (m.image) return m.image; }
    return null;
  };

  return (
    <div data-testid="shower-3d-view" style={{
      width: '100%', height: '720px', borderRadius: '12px', overflow: 'hidden',
      background: '#080808', border: '2px solid #222',
    }}>
      <Canvas
        camera={{ position: [0, H * 0.5, D * 1.2], fov: 50 }}
        shadows
        frameloop="always"
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        onCreated={({ gl }) => { gl.setClearColor('#080808'); }}
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

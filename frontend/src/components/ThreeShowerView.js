import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

// Shower box dimensions (in 3D units — roughly inches scaled down)
const W = 5;   // width
const H = 8;   // height
const D = 4;   // depth

const proxyUrl = (url) => url ? `${API_URL}/api/proxy-image?url=${encodeURIComponent(url)}` : null;

/* ---- Tile-textured wall mesh ---- */
const TiledWall = ({ position, rotation, size, imageUrl, color = '#444' }) => {
  const meshRef = useRef();
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!imageUrl) return;
    const src = proxyUrl(imageUrl);
    fetch(src)
      .then(r => r.blob())
      .then(blob => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }))
      .then(dataUrl => {
        const img = new Image();
        img.onload = () => {
          const tex = new THREE.Texture(img);
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.colorSpace = THREE.SRGBColorSpace;
          const aspect = img.width / img.height;
          tex.repeat.set(size[0] * 1.2, (size[1] * 1.2) / aspect);
          tex.needsUpdate = true;
          setTexture(tex);
        };
        img.src = dataUrl;
      })
      .catch(err => console.error('Texture load error:', err));
  }, [imageUrl]);

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={size} />
      {texture ? (
        <meshStandardMaterial map={texture} color="#ffffff" side={THREE.FrontSide} />
      ) : (
        <meshStandardMaterial color={color} side={THREE.FrontSide} />
      )}
    </mesh>
  );
};

/* ---- The 3D shower scene ---- */
const ShowerScene = ({ backWallImg, leftWallImg, rightWallImg, floorImg, ceilingImg }) => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[0, H - 0.5, 0]} intensity={0.8} distance={20} decay={2} />
      <directionalLight position={[2, H, 3]} intensity={0.5} castShadow />
      <directionalLight position={[-2, H * 0.5, -1]} intensity={0.2} />

      {/* Back wall */}
      <TiledWall
        position={[0, H / 2, -D / 2]}
        rotation={[0, 0, 0]}
        size={[W, H]}
        imageUrl={backWallImg}
        color="#3a3a3a"
      />

      {/* Left wall */}
      <TiledWall
        position={[-W / 2, H / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        size={[D, H]}
        imageUrl={leftWallImg || backWallImg}
        color="#333"
      />

      {/* Right wall */}
      <TiledWall
        position={[W / 2, H / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        size={[D, H]}
        imageUrl={rightWallImg || backWallImg}
        color="#333"
      />

      {/* Floor */}
      <TiledWall
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={[W, D]}
        imageUrl={floorImg}
        color="#555"
      />

      {/* Ceiling */}
      <TiledWall
        position={[0, H, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        size={[W, D]}
        imageUrl={ceilingImg}
        color="#bbb"
      />

      {/* Corner shadows — dark edges for ambient occlusion effect */}
      {/* Back-left edge */}
      <mesh position={[-W / 2 + 0.02, H / 2, -D / 2 + 0.02]}>
        <boxGeometry args={[0.04, H, 0.04]} />
        <meshBasicMaterial color="#000" transparent opacity={0.3} />
      </mesh>
      {/* Back-right edge */}
      <mesh position={[W / 2 - 0.02, H / 2, -D / 2 + 0.02]}>
        <boxGeometry args={[0.04, H, 0.04]} />
        <meshBasicMaterial color="#000" transparent opacity={0.3} />
      </mesh>
      {/* Floor-back edge */}
      <mesh position={[0, 0.02, -D / 2 + 0.02]}>
        <boxGeometry args={[W, 0.04, 0.04]} />
        <meshBasicMaterial color="#000" transparent opacity={0.2} />
      </mesh>

      {/* Camera controls — limited to inside the box */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.65}
        minAzimuthAngle={-Math.PI * 0.3}
        maxAzimuthAngle={Math.PI * 0.3}
        target={[0, H * 0.45, -D / 2]}
        minDistance={3}
        maxDistance={8}
      />
    </>
  );
};

/* ---- Main exported component ---- */
const ThreeShowerView = ({ schedule }) => {
  const surfaces = schedule?.surfaces || [];
  const walls = surfaces.filter(s => s.surface_type === 'wall');
  const ceiling = surfaces.find(s => s.surface_type === 'ceiling');
  const floor = surfaces.find(s => s.surface_type === 'floor');

  const backWall = walls.find(s => s.name?.toLowerCase().includes('back')) || walls[0];
  const leftWall = walls.find(s => s.name?.toLowerCase().includes('left')) || walls[1];
  const rightWall = walls.find(s => s.name?.toLowerCase().includes('right')) || walls[2];

  // Get the first material image from a surface
  const getImg = (surface) => {
    if (!surface) return null;
    const mats = surface.materials || [];
    for (const m of mats) {
      if (m.image) return m.image;
    }
    return null;
  };

  const backImg = getImg(backWall);
  const leftImg = getImg(leftWall);
  const rightImg = getImg(rightWall);
  const floorImg = getImg(floor);
  const ceilingImg = getImg(ceiling);

  // Debug: log what images we found
  useEffect(() => {
    console.log('[ThreeShowerView] surfaces:', surfaces.length, 'walls:', walls.length);
    console.log('[ThreeShowerView] backWall:', backWall?.name, 'mats:', backWall?.materials?.length);
    console.log('[ThreeShowerView] backImg:', backImg ? backImg.substring(0, 60) : 'NONE');
    console.log('[ThreeShowerView] floorImg:', floorImg ? floorImg.substring(0, 60) : 'NONE');
  }, [surfaces, backImg, floorImg]);

  return (
    <div data-testid="shower-3d-view" style={{ width: '100%', height: '720px', borderRadius: '12px', overflow: 'hidden', background: '#0a0a0a' }}>
      <Canvas
        camera={{ position: [0, H * 0.5, D * 1.1], fov: 55 }}
        shadows
        frameloop="always"
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <ShowerScene
          backWallImg={backImg}
          leftWallImg={leftImg}
          rightWallImg={rightImg}
          floorImg={floorImg}
          ceilingImg={ceilingImg}
        />
      </Canvas>
    </div>
  );
};

export default ThreeShowerView;

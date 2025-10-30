import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, PerspectiveCamera } from '@react-three/drei';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

// 3D ROOM COMPONENT
function Room3D({ roomDimensions, wallPaints, furnitureItems }) {
    const { length, width, height } = roomDimensions;
    
    // Convert feet to meters (Three.js uses meters)
    const l = length * 0.3048;
    const w = width * 0.3048;
    const h = height * 0.3048;
    
    return (
        <>
            {/* FLOOR */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[l, w]} />
                <meshStandardMaterial 
                    color={wallPaints?.floor?.hex_color || "#D4C5A9"} 
                    roughness={0.8}
                />
            </mesh>
            
            {/* BACK WALL */}
            <mesh position={[0, h/2, -w/2]}>
                <planeGeometry args={[l, h]} />
                <meshStandardMaterial 
                    color={wallPaints?.back?.hex_color || "#1E293B"} 
                    side={2}
                />
            </mesh>
            
            {/* LEFT WALL */}
            <mesh position={[-l/2, h/2, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[w, h]} />
                <meshStandardMaterial 
                    color={wallPaints?.left?.hex_color || "#1E293B"} 
                    side={2}
                />
            </mesh>
            
            {/* RIGHT WALL */}
            <mesh position={[l/2, h/2, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[w, h]} />
                <meshStandardMaterial 
                    color={wallPaints?.right?.hex_color || "#1E293B"} 
                    side={2}
                />
            </mesh>
            
            {/* CEILING */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
                <planeGeometry args={[l, w]} />
                <meshStandardMaterial 
                    color={wallPaints?.ceiling?.hex_color || "#F5F5DC"} 
                    roughness={0.9}
                />
            </mesh>
            
            {/* FURNITURE ITEMS */}
            {furnitureItems.map((item, index) => (
                <FurnitureBox key={index} item={item} />
            ))}
            
            {/* LIGHTING */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
            <pointLight position={[-5, 5, -5]} intensity={0.4} />
        </>
    );
}

// FURNITURE BOX (Placeholder - will be replaced with actual 3D models)
function FurnitureBox({ item }) {
    const x = item.position_x * 0.3048;
    const y = item.position_y * 0.3048;
    const z = item.position_z * 0.3048;
    
    return (
        <mesh position={[x, y, z]} rotation={[0, item.rotation_y, 0]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#D4A574" />
        </mesh>
    );
}

// MAIN DIMENSIONAL MOOD BOARD COMPONENT
export default function DimensionalMoodBoard({ projectId }) {
    const [moodboards, setMoodboards] = useState([]);
    const [selectedMoodboard, setSelectedMoodboard] = useState(null);
    const [paintCatalog, setPaintCatalog] = useState(null);
    const [checklistItems, setChecklistItems] = useState([]);
    const [showPaintPicker, setShowPaintPicker] = useState(false);
    const [selectedWall, setSelectedWall] = useState(null);
    const [roomDimensions, setRoomDimensions] = useState({ length: 15, width: 12, height: 10 });
    
    useEffect(() => {
        loadMoodboards();
        loadPaintCatalog();
        loadChecklistItems();
    }, [projectId]);
    
    const loadMoodboards = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/moodboards/project/${projectId}`);
            setMoodboards(response.data);
            if (response.data.length > 0) {
                setSelectedMoodboard(response.data[0]);
            }
        } catch (error) {
            console.error('Failed to load moodboards:', error);
        }
    };
    
    const loadPaintCatalog = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/moodboards/paint-catalog`);
            setPaintCatalog(response.data);
        } catch (error) {
            console.error('Failed to load paint catalog:', error);
        }
    };
    
    const loadChecklistItems = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=checklist`);
            const items = [];
            response.data.rooms?.forEach(room => {
                room.categories?.forEach(cat => {
                    cat.subcategories?.forEach(subcat => {
                        subcat.items?.forEach(item => {
                            if (item.status === 'PICKED') {
                                items.push({
                                    ...item,
                                    room_name: room.name,
                                    category_name: cat.name
                                });
                            }
                        });
                    });
                });
            });
            setChecklistItems(items);
        } catch (error) {
            console.error('Failed to load checklist items:', error);
        }
    };
    
    const createNewMoodboard = async () => {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/moodboards`, {
                project_id: projectId,
                room_name: "New Room",
                room_length: 15,
                room_width: 12,
                room_height: 10,
                furniture_items: [],
                wall_paints: [],
                notes: ""
            });
            setMoodboards([...moodboards, response.data]);
            setSelectedMoodboard(response.data);
        } catch (error) {
            console.error('Failed to create moodboard:', error);
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A]">
            {/* HEADER - Matching app theme */}
            <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] p-6 border-b-4 border-[#D4A574] shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4A574]/10 to-transparent opacity-50"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-[#D4A574] mb-2 drop-shadow-lg" style={{
                        textShadow: '0 0 20px rgba(212, 165, 116, 0.3)'
                    }}>
                        ✨ DIMENSIONAL MOOD BOARD
                    </h1>
                    <p className="text-[#D4C5A9] text-lg">3D Room Visualization & Design Studio</p>
                </div>
            </div>
            
            <div className="grid grid-cols-12 gap-6 p-6">
                {/* LEFT SIDEBAR - Controls */}
                <div className="col-span-3 space-y-4">
                    {/* New Moodboard Button */}
                    <button
                        onClick={createNewMoodboard}
                        className="w-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] hover:from-[#2D3B4F] hover:to-[#1E293B] text-[#D4A574] font-bold py-4 px-6 rounded-xl border-2 border-[#D4A574]/50 hover:border-[#D4A574] transition-all duration-300 shadow-xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4A574]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10">+ New Moodboard</span>
                    </button>
                    
                    {/* Room Dimensions */}
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 border-2 border-[#D4A574]/30 shadow-xl">
                        <h3 className="text-[#D4A574] font-bold mb-3 text-lg">📐 Room Dimensions</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[#D4C5A9] text-sm block mb-1">Length (ft)</label>
                                <input
                                    type="number"
                                    value={roomDimensions.length}
                                    onChange={(e) => setRoomDimensions({...roomDimensions, length: parseFloat(e.target.value)})}
                                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/30 focus:border-[#D4A574] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[#D4C5A9] text-sm block mb-1">Width (ft)</label>
                                <input
                                    type="number"
                                    value={roomDimensions.width}
                                    onChange={(e) => setRoomDimensions({...roomDimensions, width: parseFloat(e.target.value)})}
                                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/30 focus:border-[#D4A574] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[#D4C5A9] text-sm block mb-1">Height (ft)</label>
                                <input
                                    type="number"
                                    value={roomDimensions.height}
                                    onChange={(e) => setRoomDimensions({...roomDimensions, height: parseFloat(e.target.value)})}
                                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/30 focus:border-[#D4A574] focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Paint Selector */}
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 border-2 border-[#D4A574]/30 shadow-xl">
                        <h3 className="text-[#D4A574] font-bold mb-3 text-lg">🎨 Paint Walls</h3>
                        <div className="space-y-2">
                            {['front', 'back', 'left', 'right', 'ceiling', 'floor'].map(wall => (
                                <button
                                    key={wall}
                                    onClick={() => {
                                        setSelectedWall(wall);
                                        setShowPaintPicker(true);
                                    }}
                                    className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-3 py-2 rounded border border-[#D4A574]/30 hover:border-[#D4A574] transition-all text-left capitalize"
                                >
                                    {wall} Wall
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Checklist Items */}
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 border-2 border-[#D4A574]/30 shadow-xl max-h-96 overflow-y-auto">
                        <h3 className="text-[#D4A574] font-bold mb-3 text-lg">🛋️ Checklist Items</h3>
                        <div className="space-y-2">
                            {checklistItems.map((item, index) => (
                                <div 
                                    key={index}
                                    draggable
                                    className="bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-3 py-2 rounded border border-[#D4A574]/20 hover:border-[#D4A574] cursor-move transition-all text-sm"
                                >
                                    <div className="font-semibold">{item.name}</div>
                                    <div className="text-xs text-gray-400">{item.category_name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* CENTER - 3D VIEWER */}
                <div className="col-span-6">
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border-2 border-[#D4A574]/50 shadow-2xl overflow-hidden" style={{ height: '800px' }}>
                        <Canvas shadows camera={{ position: [8, 6, 8], fov: 50 }}>
                            <Suspense fallback={null}>
                                <Room3D 
                                    roomDimensions={roomDimensions}
                                    wallPaints={selectedMoodboard?.wall_paints || {}}
                                    furnitureItems={selectedMoodboard?.furniture_items || []}
                                />
                                <OrbitControls 
                                    enablePan={true}
                                    enableZoom={true}
                                    enableRotate={true}
                                    minDistance={3}
                                    maxDistance={30}
                                />
                                <Grid 
                                    args={[100, 100]}
                                    cellSize={0.5}
                                    cellThickness={0.5}
                                    cellColor="#D4A574"
                                    sectionSize={3}
                                    sectionThickness={1}
                                    sectionColor="#D4A574"
                                    fadeDistance={25}
                                    fadeStrength={1}
                                    infiniteGrid
                                />
                                <Sky sunPosition={[100, 20, 100]} />
                            </Suspense>
                        </Canvas>
                        
                        {/* 3D Controls Overlay */}
                        <div className="absolute top-4 left-4 bg-black/70 text-[#D4A574] px-4 py-2 rounded-lg text-sm">
                            🖱️ Left Click + Drag: Rotate | Right Click + Drag: Pan | Scroll: Zoom
                        </div>
                    </div>
                </div>
                
                {/* RIGHT SIDEBAR - Paint Catalog & Details */}
                <div className="col-span-3 space-y-4">
                    {/* Paint Picker Modal */}
                    {showPaintPicker && paintCatalog && (
                        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 border-2 border-[#D4A574]/50 shadow-2xl max-h-96 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-[#D4A574] font-bold text-lg">🎨 Select Paint</h3>
                                <button
                                    onClick={() => setShowPaintPicker(false)}
                                    className="text-gray-400 hover:text-[#D4A574]"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            {Object.keys(paintCatalog.catalogs).map(brand => (
                                <div key={brand} className="mb-4">
                                    <h4 className="text-[#D4C5A9] font-semibold mb-2 capitalize">
                                        {brand.replace(/_/g, ' ')}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {paintCatalog.catalogs[brand].map(color => (
                                            <button
                                                key={color.code}
                                                onClick={() => {
                                                    // Apply paint to selected wall
                                                    console.log(`Applying ${color.name} to ${selectedWall}`);
                                                    setShowPaintPicker(false);
                                                }}
                                                className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded border border-[#D4A574]/20 hover:border-[#D4A574] transition-all"
                                            >
                                                <div
                                                    className="w-8 h-8 rounded border border-gray-600"
                                                    style={{ backgroundColor: color.hex }}
                                                ></div>
                                                <div className="text-left text-xs">
                                                    <div className="text-[#D4C5A9] font-semibold">{color.name}</div>
                                                    <div className="text-gray-400">{color.code}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Instructions */}
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 border-2 border-[#D4A574]/30 shadow-xl">
                        <h3 className="text-[#D4A574] font-bold mb-3 text-lg">📋 Quick Guide</h3>
                        <div className="space-y-2 text-sm text-[#D4C5A9]">
                            <p>• Set room dimensions</p>
                            <p>• Paint walls with real colors</p>
                            <p>• Drag checklist items into room</p>
                            <p>• Rotate view to see all angles</p>
                            <p>• Generate client presentation</p>
                        </div>
                    </div>
                    
                    {/* Coming Soon Features */}
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 border-2 border-[#D4A574]/30 shadow-xl">
                        <h3 className="text-[#D4A574] font-bold mb-3 text-lg">🚀 Coming Soon</h3>
                        <div className="space-y-2 text-sm text-[#D4C5A9]">
                            <p>• LiDAR room scanning</p>
                            <p>• Fabric on furniture</p>
                            <p>• Item detail sheets</p>
                            <p>• Export to PDF</p>
                            <p>• Client sharing</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

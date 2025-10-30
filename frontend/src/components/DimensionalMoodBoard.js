import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

// MAIN DIMENSIONAL MOOD BOARD COMPONENT
export default function DimensionalMoodBoard({ projectId }) {
    const [moodboards, setMoodboards] = useState([]);
    const [selectedMoodboard, setSelectedMoodboard] = useState(null);
    const [paintCatalog, setPaintCatalog] = useState(null);
    const [checklistItems, setChecklistItems] = useState([]);
    const [showPaintPicker, setShowPaintPicker] = useState(false);
    const [selectedWall, setSelectedWall] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState('sherwin_williams');
    const [roomDimensions, setRoomDimensions] = useState({ length: 15, width: 12, height: 10 });
    const [wallPaints, setWallPaints] = useState({
        front: { hex: '#1E293B', name: 'Navy' },
        back: { hex: '#1E293B', name: 'Navy' },
        left: { hex: '#1E293B', name: 'Navy' },
        right: { hex: '#1E293B', name: 'Navy' },
        ceiling: { hex: '#F5F5DC', name: 'Cream' },
        floor: { hex: '#D4C5A9', name: 'Muted Gold' }
    });
    const canvasRef = useRef(null);
    
    useEffect(() => {
        loadMoodboards();
        loadPaintCatalog();
        loadChecklistItems();
        drawRoom();
    }, [projectId]);
    
    useEffect(() => {
        drawRoom();
    }, [roomDimensions, wallPaints]);
    
    const drawRoom = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, w, h);
        
        // Draw 3D room perspective
        const scale = 20;
        const centerX = w / 2;
        const centerY = h / 2;
        
        // Floor
        ctx.fillStyle = wallPaints.floor.hex;
        ctx.beginPath();
        ctx.moveTo(centerX - roomDimensions.width * scale / 2, centerY + 100);
        ctx.lineTo(centerX + roomDimensions.width * scale / 2, centerY + 100);
        ctx.lineTo(centerX + roomDimensions.width * scale / 2 - 50, centerY + 200);
        ctx.lineTo(centerX - roomDimensions.width * scale / 2 + 50, centerY + 200);
        ctx.closePath();
        ctx.fill();
        
        // Back wall
        ctx.fillStyle = wallPaints.back.hex;
        ctx.fillRect(centerX - 200, centerY - 200, 400, 300);
        
        // Left wall
        ctx.fillStyle = wallPaints.left.hex;
        ctx.beginPath();
        ctx.moveTo(centerX - 200, centerY - 200);
        ctx.lineTo(centerX - 200, centerY + 100);
        ctx.lineTo(centerX - 250, centerY + 150);
        ctx.lineTo(centerX - 250, centerY - 150);
        ctx.closePath();
        ctx.fill();
        
        // Right wall
        ctx.fillStyle = wallPaints.right.hex;
        ctx.beginPath();
        ctx.moveTo(centerX + 200, centerY - 200);
        ctx.lineTo(centerX + 200, centerY + 100);
        ctx.lineTo(centerX + 250, centerY + 150);
        ctx.lineTo(centerX + 250, centerY - 150);
        ctx.closePath();
        ctx.fill();
        
        // Add labels
        ctx.fillStyle = '#D4A574';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${roomDimensions.length}' x ${roomDimensions.width}' x ${roomDimensions.height}'`, centerX, 30);
    };
    
    const loadMoodboards = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/moodboards/project/${projectId}`);
            setMoodboards(response.data);
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
    
    const applyPaintToWall = (wall, color) => {
        setWallPaints({
            ...wallPaints,
            [wall]: { hex: color.hex, name: color.name, code: color.code }
        });
        setShowPaintPicker(false);
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

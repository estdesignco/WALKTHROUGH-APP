import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

export default function FullscreenMoodboard({ projectId }) {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('dollhouse'); // dollhouse, flat3d, floorplan
    const [moodboard, setMoodboard] = useState(null);
    const [paintCatalog, setPaintCatalog] = useState(null);
    const [checklistItems, setChecklistItems] = useState([]);
    const [showPaintPicker, setShowPaintPicker] = useState(false);
    const [showChecklist, setShowChecklist] = useState(false);
    const [selectedWall, setSelectedWall] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState('sherwin_williams');
    const [roomPhoto, setRoomPhoto] = useState(null);
    const [aiRenders, setAiRenders] = useState({
        dollhouse: null,
        flat3d: null,
        floorplan: null
    });
    const [generating, setGenerating] = useState(false);
    const [roomDimensions, setRoomDimensions] = useState({ length: 15, width: 12, height: 10 });
    const [wallPaints, setWallPaints] = useState({
        front: { hex: '#1E293B', name: 'Naval', code: 'SW 6244' },
        back: { hex: '#1E293B', name: 'Naval', code: 'SW 6244' },
        left: { hex: '#1E293B', name: 'Naval', code: 'SW 6244' },
        right: { hex: '#1E293B', name: 'Naval', code: 'SW 6244' },
        ceiling: { hex: '#F5F5DC', name: 'Alabaster', code: 'SW 7008' },
        floor: { hex: '#D4C5A9', name: 'Muted Gold', code: 'Custom' }
    });
    const [placedItems, setPlacedItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    
    useEffect(() => {
        loadOrCreateMoodboard();
        loadPaintCatalog();
        loadChecklistItems();
    }, [projectId]);
    
    useEffect(() => {
        drawCurrentView();
    }, [viewMode, roomDimensions, wallPaints, placedItems, roomPhoto]);
    
    const loadOrCreateMoodboard = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/moodboards/project/${projectId}`);
            if (response.data && response.data.length > 0) {
                const mb = response.data[0];
                setMoodboard(mb);
                if (mb.room_photo_base64) {
                    setRoomPhoto(`data:image/png;base64,${mb.room_photo_base64}`);
                }
            } else {
                const newMb = await axios.post(`${BACKEND_URL}/api/moodboards`, {
                    project_id: projectId,
                    room_name: "Main Room",
                    room_length: 15,
                    room_width: 12,
                    room_height: 10,
                    furniture_items: [],
                    wall_paints: [],
                    notes: ""
                });
                setMoodboard(newMb.data);
            }
        } catch (error) {
            console.error('Failed to load moodboard:', error);
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
    
    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || !moodboard) return;
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            await axios.post(`${BACKEND_URL}/api/moodboards/${moodboard.id}/upload-photo`, formData);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                setRoomPhoto(e.target.result);
            };
            reader.readAsDataURL(file);
            
            alert('✅ Photo uploaded! Now generating 3 views...');
            // TODO: Trigger AI to generate 3 views from this photo
        } catch (error) {
            console.error('Failed to upload photo:', error);
        }
    };
    
    const applyPaintToWall = (wall, color) => {
        const newWallPaints = {
            ...wallPaints,
            [wall]: { hex: color.hex, name: color.name, code: color.code }
        };
        setWallPaints(newWallPaints);
        setShowPaintPicker(false);
    };
    
    const drawCurrentView = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        
        // Clear
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, w, h);
        
        if (viewMode === 'dollhouse') {
            // 3D Perspective View
            const centerX = w / 2;
            const centerY = h / 2;
            
            // Back wall
            ctx.fillStyle = wallPaints.back.hex;
            ctx.fillRect(centerX - 300, centerY - 300, 600, 400);
            
            // Left wall
            ctx.fillStyle = wallPaints.left.hex;
            ctx.beginPath();
            ctx.moveTo(centerX - 300, centerY - 300);
            ctx.lineTo(centerX - 300, centerY + 100);
            ctx.lineTo(centerX - 400, centerY + 200);
            ctx.lineTo(centerX - 400, centerY - 200);
            ctx.closePath();
            ctx.fill();
            
            // Right wall
            ctx.fillStyle = wallPaints.right.hex;
            ctx.beginPath();
            ctx.moveTo(centerX + 300, centerY - 300);
            ctx.lineTo(centerX + 300, centerY + 100);
            ctx.lineTo(centerX + 400, centerY + 200);
            ctx.lineTo(centerX + 400, centerY - 200);
            ctx.closePath();
            ctx.fill();
            
            // Floor
            ctx.fillStyle = wallPaints.floor.hex;
            ctx.beginPath();
            ctx.moveTo(centerX - 300, centerY + 100);
            ctx.lineTo(centerX + 300, centerY + 100);
            ctx.lineTo(centerX + 400, centerY + 200);
            ctx.lineTo(centerX - 400, centerY + 200);
            ctx.closePath();
            ctx.fill();
            
        } else if (viewMode === 'flat3d') {
            // Top-down view
            const scale = 40;
            const centerX = w / 2;
            const centerY = h / 2;
            const roomW = roomDimensions.width * scale;
            const roomL = roomDimensions.length * scale;
            
            // Floor
            ctx.fillStyle = wallPaints.floor.hex;
            ctx.fillRect(centerX - roomW/2, centerY - roomL/2, roomW, roomL);
            
            // Grid
            ctx.strokeStyle = '#D4A574';
            ctx.lineWidth = 1;
            for (let i = 0; i <= roomDimensions.width; i++) {
                ctx.beginPath();
                ctx.moveTo(centerX - roomW/2 + i * scale, centerY - roomL/2);
                ctx.lineTo(centerX - roomW/2 + i * scale, centerY + roomL/2);
                ctx.stroke();
            }
            for (let i = 0; i <= roomDimensions.length; i++) {
                ctx.beginPath();
                ctx.moveTo(centerX - roomW/2, centerY - roomL/2 + i * scale);
                ctx.lineTo(centerX + roomW/2, centerY - roomL/2 + i * scale);
                ctx.stroke();
            }
            
            // Walls
            ctx.strokeStyle = wallPaints.back.hex;
            ctx.lineWidth = 10;
            ctx.strokeRect(centerX - roomW/2, centerY - roomL/2, roomW, roomL);
            
        } else if (viewMode === 'floorplan') {
            // Architectural floor plan
            const scale = 40;
            const centerX = w / 2;
            const centerY = h / 2;
            const roomW = roomDimensions.width * scale;
            const roomL = roomDimensions.length * scale;
            
            // White background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);
            
            // Walls
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 8;
            ctx.strokeRect(centerX - roomW/2, centerY - roomL/2, roomW, roomL);
            
            // Dimension lines
            ctx.strokeStyle = '#D4A574';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            // Width
            ctx.beginPath();
            ctx.moveTo(centerX - roomW/2 - 40, centerY - roomL/2);
            ctx.lineTo(centerX - roomW/2 - 40, centerY + roomL/2);
            ctx.stroke();
            
            // Length
            ctx.beginPath();
            ctx.moveTo(centerX - roomW/2, centerY + roomL/2 + 40);
            ctx.lineTo(centerX + roomW/2, centerY + roomL/2 + 40);
            ctx.stroke();
            
            ctx.setLineDash([]);
            
            // Labels
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.save();
            ctx.translate(centerX - roomW/2 - 60, centerY);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(`${roomDimensions.length}'`, 0, 0);
            ctx.restore();
            ctx.fillText(`${roomDimensions.width}'`, centerX, centerY + roomL/2 + 60);
        }
        
        // Placed items
        placedItems.forEach((item, index) => {
            const isSelected = selectedItems.includes(index);
            const scale = viewMode === 'floorplan' ? 40 : 30;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const x = centerX + item.position_x * scale;
            const z = centerY + item.position_z * scale;
            
            ctx.fillStyle = isSelected ? '#D4A574' : '#8B7355';
            ctx.fillRect(x - 25, z - 25, 50, 50);
            ctx.strokeStyle = isSelected ? '#FFD700' : '#000';
            ctx.lineWidth = isSelected ? 3 : 1;
            ctx.strokeRect(x - 25, z - 25, 50, 50);
            
            ctx.fillStyle = viewMode === 'floorplan' ? '#000' : '#FFF';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.name.substring(0, 12), x, z + 40);
        });
    };
    
    const addItemToRoom = (item) => {
        const newItem = {
            item_id: item.id,
            name: item.name,
            position_x: 0,
            position_y: 0,
            position_z: 0,
            rotation_y: 0,
            scale: 1.0,
            placement_type: 'floor',
            image_url: item.image_url,
            dimensions: item.size || item.dimensions,
            color: item.finish_color || item.color,
            price: item.cost || item.price
        };
        
        setPlacedItems([...placedItems, newItem]);
        setShowChecklist(false);
    };
    
    return (
        <div className="fixed inset-0 bg-[#0F172A] flex flex-col">
            {/* MINIMAL TOP BAR */}
            <div className="h-12 bg-gradient-to-r from-[#1E293B] to-[#0F172A] border-b-2 border-[#D4A574] flex items-center justify-between px-4">
                {/* Left: Back button */}
                <button
                    onClick={() => navigate(`/project/${projectId}?tab=Checklist`)}
                    className="text-[#D4A574] hover:text-[#BCA888] font-semibold flex items-center gap-2"
                >
                    ← Back to Project
                </button>
                
                {/* Center: View modes */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('dollhouse')}
                        className={`px-3 py-1 rounded text-sm ${
                            viewMode === 'dollhouse' ? 'bg-[#D4A574] text-black' : 'bg-gray-800 text-[#D4C5A9]'
                        }`}
                    >
                        🏠 3D Dollhouse
                    </button>
                    <button
                        onClick={() => setViewMode('flat3d')}
                        className={`px-3 py-1 rounded text-sm ${
                            viewMode === 'flat3d' ? 'bg-[#D4A574] text-black' : 'bg-gray-800 text-[#D4C5A9]'
                        }`}
                    >
                        📐 Flat 3D
                    </button>
                    <button
                        onClick={() => setViewMode('floorplan')}
                        className={`px-3 py-1 rounded text-sm ${
                            viewMode === 'floorplan' ? 'bg-[#D4A574] text-black' : 'bg-gray-800 text-[#D4C5A9]'
                        }`}
                    >
                        📏 Floor Plan
                    </button>
                </div>
                
                {/* Right: Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowChecklist(!showChecklist)}
                        className="bg-gray-800 hover:bg-gray-700 text-[#D4A574] px-3 py-1 rounded text-sm"
                    >
                        📋 Checklist ({checklistItems.length})
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gray-800 hover:bg-gray-700 text-[#D4A574] px-3 py-1 rounded text-sm"
                    >
                        📷 Upload Photo
                    </button>
                    <button
                        onClick={() => setGenerating(true)}
                        disabled={generating || !roomPhoto}
                        className="bg-[#D4A574] hover:bg-[#BCA888] text-black font-bold px-4 py-1 rounded text-sm disabled:opacity-50"
                    >
                        {generating ? '⏳ Generating...' : '✨ AI Generate Views'}
                    </button>
                </div>
            </div>
            
            {/* MAIN WORKSPACE - FULLSCREEN */}
            <div className="flex-1 flex relative">
                {/* LEFT MINIMAL TOOLBAR */}
                <div className="w-48 bg-gray-900/30 border-r border-[#D4A574]/30 p-2 space-y-2 overflow-y-auto">
                    {/* Dimensions */}
                    <div className="bg-gray-900/50 rounded p-2">
                        <h4 className="text-[#D4A574] text-xs font-bold mb-2">📐 Room Size</h4>
                        <input
                            type="number"
                            value={roomDimensions.length}
                            onChange={(e) => setRoomDimensions({...roomDimensions, length: parseFloat(e.target.value) || 15})}
                            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-xs mb-1"
                            placeholder="Length (ft)"
                        />
                        <input
                            type="number"
                            value={roomDimensions.width}
                            onChange={(e) => setRoomDimensions({...roomDimensions, width: parseFloat(e.target.value) || 12})}
                            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-xs mb-1"
                            placeholder="Width (ft)"
                        />
                        <input
                            type="number"
                            value={roomDimensions.height}
                            onChange={(e) => setRoomDimensions({...roomDimensions, height: parseFloat(e.target.value) || 10})}
                            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-xs"
                            placeholder="Height (ft)"
                        />
                    </div>
                    
                    {/* Paint */}
                    <div className="bg-gray-900/50 rounded p-2">
                        <h4 className="text-[#D4A574] text-xs font-bold mb-2">🎨 Paint</h4>
                        {['front', 'back', 'left', 'right', 'ceiling', 'floor'].map(wall => (
                            <button
                                key={wall}
                                onClick={() => {
                                    setSelectedWall(wall);
                                    setShowPaintPicker(true);
                                }}
                                className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-2 py-1 rounded text-xs mb-1 flex items-center justify-between capitalize"
                            >
                                <span>{wall}</span>
                                <div className="w-4 h-4 rounded border border-gray-600" style={{ backgroundColor: wallPaints[wall].hex }}></div>
                            </button>
                        ))}
                    </div>
                    
                    {/* AI Tools */}
                    <div className="bg-gray-900/50 rounded p-2">
                        <h4 className="text-[#D4A574] text-xs font-bold mb-2">🤖 AI Tools</h4>
                        <button className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-2 py-1 rounded text-xs mb-1">
                            Remove All Furniture
                        </button>
                        <button className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-2 py-1 rounded text-xs mb-1">
                            Remove Selected
                        </button>
                        <button className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-2 py-1 rounded text-xs">
                            Recolor Walls
                        </button>
                    </div>
                </div>
                
                {/* CENTER - MAXIMUM CANVAS */}
                <div className="flex-1 relative bg-black">
                    {roomPhoto && (
                        <img 
                            src={roomPhoto} 
                            alt="Room" 
                            className="absolute inset-0 w-full h-full object-contain"
                        />
                    )}
                    <canvas 
                        ref={canvasRef}
                        width={1800}
                        height={1000}
                        className="absolute inset-0 w-full h-full"
                        style={{ opacity: roomPhoto ? 0.5 : 1 }}
                    />
                    
                    {/* View indicator */}
                    <div className="absolute top-2 left-2 bg-black/70 text-[#D4A574] px-3 py-1 rounded text-xs">
                        {viewMode === 'dollhouse' ? '🏠 3D Dollhouse View' : 
                         viewMode === 'flat3d' ? '📐 Flat 3D View' : 
                         '📏 Floor Plan View'}
                    </div>
                </div>
                
                {/* RIGHT MINIMAL PANEL */}
                <div className="w-64 bg-gray-900/30 border-l border-[#D4A574]/30 p-2 space-y-2 overflow-y-auto">
                    {/* Paint Picker */}
                    {showPaintPicker && paintCatalog && (
                        <div className="bg-gray-900 rounded p-2">
                            <div className="flex justify-between mb-2">
                                <h4 className="text-[#D4A574] text-xs font-bold">Paint {selectedWall}</h4>
                                <button onClick={() => setShowPaintPicker(false)} className="text-gray-400">✕</button>
                            </div>
                            
                            <div className="flex gap-1 mb-2 flex-wrap">
                                {Object.keys(paintCatalog.catalogs).map(brand => (
                                    <button
                                        key={brand}
                                        onClick={() => setSelectedBrand(brand)}
                                        className={`px-2 py-0.5 rounded text-xs ${
                                            selectedBrand === brand ? 'bg-[#D4A574] text-black' : 'bg-gray-800 text-gray-400'
                                        }`}
                                    >
                                        {brand.split('_')[0].toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="space-y-1 max-h-96 overflow-y-auto">
                                {paintCatalog.catalogs[selectedBrand]?.map(color => (
                                    <button
                                        key={color.code}
                                        onClick={() => applyPaintToWall(selectedWall, color)}
                                        className="w-full flex items-center gap-2 p-1 bg-gray-800 hover:bg-gray-700 rounded text-xs"
                                    >
                                        <div className="w-6 h-6 rounded" style={{ backgroundColor: color.hex }}></div>
                                        <div className="text-left flex-1">
                                            <div className="text-[#D4C5A9] font-semibold">{color.name}</div>
                                            <div className="text-gray-400">{color.code}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {!showPaintPicker && (
                        <div className="bg-gray-900/50 rounded p-2">
                            <h4 className="text-[#D4A574] text-xs font-bold mb-2">Current Colors</h4>
                            {Object.entries(wallPaints).slice(0, 4).map(([wall, paint]) => (
                                <div key={wall} className="flex items-center gap-1 mb-1">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: paint.hex }}></div>
                                    <span className="text-[#D4C5A9] text-xs capitalize">{wall}: {paint.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* CHECKLIST OVERLAY */}
                {showChecklist && (
                    <div className="absolute inset-y-0 right-0 w-80 bg-gray-900 border-l-2 border-[#D4A574] p-4 overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[#D4A574] font-bold text-lg">📋 Checklist Items</h3>
                            <button onClick={() => setShowChecklist(false)} className="text-gray-400 hover:text-[#D4A574] text-2xl">✕</button>
                        </div>
                        {checklistItems.map((item, i) => (
                            <div
                                key={i}
                                onClick={() => addItemToRoom(item)}
                                className="bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-3 py-2 rounded mb-2 cursor-pointer border border-[#D4A574]/20 hover:border-[#D4A574]"
                            >
                                <div className="font-semibold">{item.name}</div>
                                <div className="text-xs text-gray-400">{item.category_name}</div>
                                {item.cost > 0 && <div className="text-xs text-[#D4A574]">${item.cost}</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
            />
        </div>
    );
}

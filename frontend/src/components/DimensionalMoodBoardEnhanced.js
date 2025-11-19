import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin;

export default function DimensionalMoodBoardEnhanced({ projectId }) {
    // View mode: dollhouse, flat3d, floorplan
    const [viewMode, setViewMode] = useState('dollhouse');
    // Edit mode: hybrid, ai
    const [editMode, setEditMode] = useState('hybrid');
    const [moodboard, setMoodboard] = useState(null);
    const [paintCatalog, setPaintCatalog] = useState(null);
    const [checklistItems, setChecklistItems] = useState([]);
    const [showPaintPicker, setShowPaintPicker] = useState(false);
    const [selectedWall, setSelectedWall] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState('sherwin_williams');
    const [roomPhoto, setRoomPhoto] = useState(null);
    const [aiRender, setAiRender] = useState(null);
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
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    
    useEffect(() => {
        loadMoodboard();
        loadPaintCatalog();
        loadChecklistItems();
    }, [projectId]);
    
    useEffect(() => {
        if (viewMode === 'dollhouse' || viewMode === 'flat3d') {
            drawRoom();
        } else if (viewMode === 'floorplan') {
            drawFloorPlan();
        }
    }, [viewMode, roomDimensions, wallPaints, placedItems]);
    
    const loadMoodboard = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/moodboards/project/${projectId}`);
            if (response.data && response.data.length > 0) {
                setMoodboard(response.data[0]);
                if (response.data[0].room_photo_base64) {
                    setRoomPhoto(`data:image/png;base64,${response.data[0].room_photo_base64}`);
                }
                if (response.data[0].ai_render_base64) {
                    setAiRender(`data:image/png;base64,${response.data[0].ai_render_base64}`);
                }
            } else {
                // Create new moodboard
                const newMoodboard = await axios.post(`${BACKEND_URL}/api/moodboards`, {
                    project_id: projectId,
                    room_name: "Main Room",
                    room_length: 15,
                    room_width: 12,
                    room_height: 10,
                    furniture_items: [],
                    wall_paints: [],
                    notes: ""
                });
                setMoodboard(newMoodboard.data);
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
            
            // Display photo locally
            const reader = new FileReader();
            reader.onload = (e) => {
                setRoomPhoto(e.target.result);
            };
            reader.readAsDataURL(file);
            
            alert('✅ Photo uploaded successfully!');
        } catch (error) {
            console.error('Failed to upload photo:', error);
            alert('❌ Failed to upload photo');
        }
    };
    
    const generateAIRender = async () => {
        if (!moodboard) return;
        
        setGenerating(true);
        try {
            const response = await axios.post(`${BACKEND_URL}/api/moodboards/${moodboard.id}/generate-render`, {});
            setAiRender(`data:image/png;base64,${response.data.image_base64}`);
            alert('✅ AI render generated!');
        } catch (error) {
            console.error('Failed to generate AI render:', error);
            alert('❌ Failed to generate AI render: ' + error.message);
        } finally {
            setGenerating(false);
        }
    };
    
    const applyPaintToWall = (wall, color) => {
        const newWallPaints = {
            ...wallPaints,
            [wall]: { hex: color.hex, name: color.name, code: color.code }
        };
        setWallPaints(newWallPaints);
        setShowPaintPicker(false);
        
        // Save to backend
        if (moodboard) {
            axios.put(`${BACKEND_URL}/api/moodboards/${moodboard.id}`, {
                wall_paints: Object.entries(newWallPaints).map(([wall_id, paint]) => ({
                    wall_id,
                    paint_brand: selectedBrand,
                    paint_name: paint.name,
                    paint_code: paint.code,
                    hex_color: paint.hex
                }))
            }).catch(err => console.error('Failed to save paint:', err));
        }
    };
    
    const addItemToRoom = (item) => {
        const newItem = {
            item_id: item.id,
            name: item.name,
            position_x: Math.random() * roomDimensions.length - roomDimensions.length / 2,
            position_y: 0,
            position_z: Math.random() * roomDimensions.width - roomDimensions.width / 2,
            rotation_y: 0,
            scale: 1.0,
            placement_type: 'floor',
            image_url: item.image_url,
            dimensions: item.size || item.dimensions,
            color: item.finish_color || item.color,
            price: item.cost || item.price
        };
        
        setPlacedItems([...placedItems, newItem]);
    };
    
    // DRAW 3D DOLLHOUSE VIEW
    const drawRoom = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, w, h);
        
        if (viewMode === 'dollhouse') {
            // 3D perspective room
            const scale = 15;
            const centerX = w / 2;
            const centerY = h / 2;
            
            // Back wall
            ctx.fillStyle = wallPaints.back.hex;
            ctx.fillRect(centerX - 250, centerY - 250, 500, 350);
            
            // Left wall (perspective)
            ctx.fillStyle = wallPaints.left.hex;
            ctx.beginPath();
            ctx.moveTo(centerX - 250, centerY - 250);
            ctx.lineTo(centerX - 250, centerY + 100);
            ctx.lineTo(centerX - 350, centerY + 180);
            ctx.lineTo(centerX - 350, centerY - 170);
            ctx.closePath();
            ctx.fill();
            
            // Right wall (perspective)
            ctx.fillStyle = wallPaints.right.hex;
            ctx.beginPath();
            ctx.moveTo(centerX + 250, centerY - 250);
            ctx.lineTo(centerX + 250, centerY + 100);
            ctx.lineTo(centerX + 350, centerY + 180);
            ctx.lineTo(centerX + 350, centerY - 170);
            ctx.closePath();
            ctx.fill();
            
            // Floor
            ctx.fillStyle = wallPaints.floor.hex;
            ctx.beginPath();
            ctx.moveTo(centerX - 250, centerY + 100);
            ctx.lineTo(centerX + 250, centerY + 100);
            ctx.lineTo(centerX + 350, centerY + 180);
            ctx.lineTo(centerX - 350, centerY + 180);
            ctx.closePath();
            ctx.fill();
            
            // Grid on floor
            ctx.strokeStyle = '#D4A574';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 10; i++) {
                const x = centerX - 250 + (500 / 10) * i;
                ctx.beginPath();
                ctx.moveTo(x, centerY + 100);
                ctx.lineTo(x - 100 + (200 / 10) * i, centerY + 180);
                ctx.stroke();
            }
            
        } else if (viewMode === 'flat3d') {
            // Top-down view
            const scale = 30;
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
            
            // Walls outline
            ctx.strokeStyle = wallPaints.back.hex;
            ctx.lineWidth = 8;
            ctx.strokeRect(centerX - roomW/2, centerY - roomL/2, roomW, roomL);
            
            // Placed furniture (top-down boxes)
            placedItems.forEach(item => {
                const x = centerX + item.position_x * scale;
                const z = centerY + item.position_z * scale;
                
                ctx.fillStyle = '#D4A574';
                ctx.fillRect(x - 15, z - 15, 30, 30);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(x - 15, z - 15, 30, 30);
            });
        }
        
        // Dimension label
        ctx.fillStyle = '#D4A574';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${roomDimensions.length}' × ${roomDimensions.width}' × ${roomDimensions.height}'`, w / 2, 30);
    };
    
    // DRAW FLOOR PLAN VIEW
    const drawFloorPlan = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        
        // Clear with white background for floor plan
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        
        const scale = 30;
        const centerX = w / 2;
        const centerY = h / 2;
        const roomW = roomDimensions.width * scale;
        const roomL = roomDimensions.length * scale;
        
        // Walls
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.strokeRect(centerX - roomW/2, centerY - roomL/2, roomW, roomL);
        
        // Dimension lines
        ctx.strokeStyle = '#D4A574';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        // Width dimension
        ctx.beginPath();
        ctx.moveTo(centerX - roomW/2 - 30, centerY - roomL/2);
        ctx.lineTo(centerX - roomW/2 - 30, centerY + roomL/2);
        ctx.stroke();
        
        // Length dimension
        ctx.beginPath();
        ctx.moveTo(centerX - roomW/2, centerY + roomL/2 + 30);
        ctx.lineTo(centerX + roomW/2, centerY + roomL/2 + 30);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Labels
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.save();
        ctx.translate(centerX - roomW/2 - 50, centerY);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${roomDimensions.length}'`, 0, 0);
        ctx.restore();
        
        ctx.fillText(`${roomDimensions.width}'`, centerX, centerY + roomL/2 + 50);
        
        // Grid
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < roomDimensions.width; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX - roomW/2 + i * scale, centerY - roomL/2);
            ctx.lineTo(centerX - roomW/2 + i * scale, centerY + roomL/2);
            ctx.stroke();
        }
        for (let i = 1; i < roomDimensions.length; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX - roomW/2, centerY - roomL/2 + i * scale);
            ctx.lineTo(centerX + roomW/2, centerY - roomL/2 + i * scale);
            ctx.stroke();
        }
        
        // Furniture (simple boxes with labels)
        placedItems.forEach(item => {
            const x = centerX + item.position_x * scale;
            const z = centerY + item.position_z * scale;
            
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(x - 20, z - 20, 40, 40);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 20, z - 20, 40, 40);
            
            // Item name
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.name.substring(0, 10), x, z + 35);
        });
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A]">
            {/* MINIMAL HEADER */}
            <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] px-4 py-2 border-b-2 border-[#D4A574] flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#D4A574]">✨ MOODBOARD</h1>
                
                {/* VIEW MODE SELECTOR */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('dollhouse')}
                        className={`px-3 py-1 rounded text-sm font-semibold transition-all ${
                            viewMode === 'dollhouse'
                                ? 'bg-[#D4A574] text-black'
                                : 'bg-gray-800 text-[#D4C5A9] hover:bg-gray-700'
                        }`}
                    >
                        🏠 3D Dollhouse
                    </button>
                    <button
                        onClick={() => setViewMode('flat3d')}
                        className={`px-3 py-1 rounded text-sm font-semibold transition-all ${
                            viewMode === 'flat3d'
                                ? 'bg-[#D4A574] text-black'
                                : 'bg-gray-800 text-[#D4C5A9] hover:bg-gray-700'
                        }`}
                    >
                        📐 Flat 3D
                    </button>
                    <button
                        onClick={() => setViewMode('floorplan')}
                        className={`px-3 py-1 rounded text-sm font-semibold transition-all ${
                            viewMode === 'floorplan'
                                ? 'bg-[#D4A574] text-black'
                                : 'bg-gray-800 text-[#D4C5A9] hover:bg-gray-700'
                        }`}
                    >
                        📏 Floor Plan
                    </button>
                </div>
                
                {/* EDIT MODE SELECTOR */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setEditMode('hybrid')}
                        className={`px-3 py-1 rounded text-sm font-semibold transition-all ${
                            editMode === 'hybrid'
                                ? 'bg-[#D4A574] text-black'
                                : 'bg-gray-800 text-[#D4C5A9] hover:bg-gray-700'
                        }`}
                    >
                        ⚡ Quick Edit
                    </button>
                    <button
                        onClick={() => setEditMode('ai')}
                        className={`px-3 py-1 rounded text-sm font-semibold transition-all ${
                            editMode === 'ai'
                                ? 'bg-[#D4A574] text-black'
                                : 'bg-gray-800 text-[#D4C5A9] hover:bg-gray-700'
                        }`}
                    >
                        ✨ AI Photorealistic
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-12 gap-2 p-2">
                {/* LEFT MINIMAL SIDEBAR */}
                <div className="col-span-2 space-y-2 max-h-screen overflow-y-auto">
                    {/* Room Dimensions - Compact */}
                    <div className="bg-gray-900/50 rounded p-2 border border-[#D4A574]/20">
                        <h4 className="text-[#D4A574] font-bold text-xs mb-2">📐 Dimensions</h4>
                        <input
                            type="number"
                            value={roomDimensions.length}
                            onChange={(e) => setRoomDimensions({...roomDimensions, length: parseFloat(e.target.value) || 15})}
                            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-xs mb-1"
                            placeholder="L (ft)"
                        />
                        <input
                            type="number"
                            value={roomDimensions.width}
                            onChange={(e) => setRoomDimensions({...roomDimensions, width: parseFloat(e.target.value) || 12})}
                            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-xs mb-1"
                            placeholder="W (ft)"
                        />
                        <input
                            type="number"
                            value={roomDimensions.height}
                            onChange={(e) => setRoomDimensions({...roomDimensions, height: parseFloat(e.target.value) || 10})}
                            className="w-full bg-gray-800 text-white px-2 py-1 rounded text-xs"
                            placeholder="H (ft)"
                        />
                    </div>
                    
                    {/* Paint Walls - Compact */}
                    <div className="bg-gray-900/50 rounded p-2 border border-[#D4A574]/20">
                        <h4 className="text-[#D4A574] font-bold text-xs mb-2">🎨 Paint</h4>
                        {['front', 'back', 'left', 'right', 'ceiling', 'floor'].map(wall => (
                            <button
                                key={wall}
                                onClick={() => {
                                    setSelectedWall(wall);
                                    setShowPaintPicker(true);
                                }}
                                className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-2 py-1 rounded text-xs capitalize flex items-center justify-between mb-1"
                            >
                                <span>{wall}</span>
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: wallPaints[wall].hex }}></div>
                            </button>
                        ))}
                    </div>
                    
                    {/* Checklist Items - Compact */}
                    <div className="bg-gray-900/50 rounded p-2 border border-[#D4A574]/20 max-h-64 overflow-y-auto">
                        <h4 className="text-[#D4A574] font-bold text-xs mb-2">🛋️ Items ({checklistItems.length})</h4>
                        {checklistItems.map((item, i) => (
                            <div
                                key={i}
                                onClick={() => addItemToRoom(item)}
                                className="bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-2 py-1 rounded text-xs cursor-pointer mb-1"
                            >
                                {item.name}
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* CENTER - MAXIMUM WORKSPACE */}
                <div className="col-span-8">
                    <div className="bg-black rounded border-2 border-[#D4A574]/50 relative" style={{ height: 'calc(100vh - 120px)' }}>
                        {editMode === 'hybrid' ? (
                            // HYBRID MODE - Canvas or Photo with Overlay
                            <>
                                {roomPhoto && (
                                    <img src={roomPhoto} alt="Room" className="absolute inset-0 w-full h-full object-contain" />
                                )}
                                <canvas 
                                    ref={canvasRef}
                                    width={1400}
                                    height={900}
                                    className="w-full h-full"
                                    style={roomPhoto ? { opacity: 0.7, mixBlendMode: 'multiply' } : {}}
                                />
                            </>
                        ) : (
                            // AI MODE - Show AI render
                            <div className="w-full h-full flex items-center justify-center">
                                {aiRender ? (
                                    <img src={aiRender} alt="AI Render" className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <div className="text-center">
                                        <p className="text-[#D4C5A9] mb-4">No AI render yet</p>
                                        <button
                                            onClick={generateAIRender}
                                            disabled={generating}
                                            className="bg-[#D4A574] hover:bg-[#BCA888] text-black font-bold px-6 py-3 rounded-lg disabled:opacity-50"
                                        >
                                            {generating ? '⏳ Generating...' : '✨ Generate Photorealistic Render'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Mode indicator */}
                        <div className="absolute top-2 left-2 bg-black/70 text-[#D4A574] px-3 py-1 rounded text-xs">
                            {editMode === 'hybrid' ? '⚡ Quick Edit Mode' : '✨ AI Photorealistic Mode'}
                        </div>
                    </div>
                </div>
                
                {/* RIGHT MINIMAL SIDEBAR */}
                <div className="col-span-2 space-y-2 max-h-screen overflow-y-auto">
                    {/* Upload Photo */}
                    <div className="bg-gray-900/50 rounded p-2 border border-[#D4A574]/20">
                        <h4 className="text-[#D4A574] font-bold text-xs mb-2">📷 Photo</h4>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-2 py-1 rounded text-xs"
                        >
                            Upload Room Photo
                        </button>
                    </div>
                    
                    {/* AI Actions */}
                    {editMode === 'ai' && (
                        <div className="bg-gray-900/50 rounded p-2 border border-[#D4A574]/20">
                            <button
                                onClick={generateAIRender}
                                disabled={generating}
                                className="w-full bg-[#D4A574] hover:bg-[#BCA888] text-black font-bold px-2 py-2 rounded text-xs disabled:opacity-50"
                            >
                                {generating ? '⏳...' : '✨ Generate'}
                            </button>
                        </div>
                    )}
                    
                    {/* Paint Picker */}
                    {showPaintPicker && paintCatalog && (
                        <div className="bg-gray-900 rounded p-2 border-2 border-[#D4A574]/50 max-h-96 overflow-y-auto">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-[#D4A574] font-bold text-xs">Paint {selectedWall}</h4>
                                <button onClick={() => setShowPaintPicker(false)} className="text-gray-400 hover:text-[#D4A574]">✕</button>
                            </div>
                            
                            {/* Brand tabs */}
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
                            
                            {/* Colors */}
                            <div className="space-y-1">
                                {paintCatalog.catalogs[selectedBrand]?.map(color => (
                                    <button
                                        key={color.code}
                                        onClick={() => applyPaintToWall(selectedWall, color)}
                                        className="w-full flex items-center gap-2 p-1 bg-gray-800 hover:bg-gray-700 rounded text-xs"
                                    >
                                        <div className="w-6 h-6 rounded" style={{ backgroundColor: color.hex }}></div>
                                        <div className="text-left flex-1">
                                            <div className="text-[#D4C5A9] font-semibold">{color.name}</div>
                                            <div className="text-gray-400 text-xs">{color.code}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {!showPaintPicker && (
                        <div className="bg-gray-900/50 rounded p-2 border border-[#D4A574]/20">
                            <h4 className="text-[#D4A574] font-bold text-xs mb-2">Current Colors</h4>
                            {Object.entries(wallPaints).slice(0, 4).map(([wall, paint]) => (
                                <div key={wall} className="flex items-center gap-1 mb-1">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: paint.hex }}></div>
                                    <span className="text-[#D4C5A9] text-xs capitalize">{wall}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

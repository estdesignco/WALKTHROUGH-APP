import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

export default function Flat3DDocument({ moodboardId, sharedData, updateSharedData, paintCatalog, roomPhotos, selectedRoom }) {
    const canvasRef = useRef(null);
    const [photo, setPhoto] = useState(null);
    const [showPaintPicker, setShowPaintPicker] = useState(false);
    const [selectedWall, setSelectedWall] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState('sherwin_williams');
    const [generating, setGenerating] = useState(false);
    const [furnitureSegments, setFurnitureSegments] = useState([]);
    const [selectedSegments, setSelectedSegments] = useState([]);
    const fileInputRef = useRef(null);
    
    const handleQuickUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            setPhoto(e.target.result);
            alert('✅ Photo loaded! (Temporary - not saved to Measurements)');
        };
        reader.readAsDataURL(file);
    };
    
    useEffect(() => {
        if (roomPhotos && roomPhotos.length > 0) {
            // Use first photo from room
            const firstPhoto = roomPhotos[0];
            if (firstPhoto.photo_base64) {
                setPhoto(`data:image/png;base64,${firstPhoto.photo_base64}`);
            } else if (firstPhoto.photo_url) {
                setPhoto(firstPhoto.photo_url);
            }
        }
    }, [roomPhotos]);
    
    useEffect(() => {
        drawFlat3D();
    }, [sharedData, photo]);
    
    const drawFlat3D = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, w, h);
        
        const scale = 40;
        const centerX = w / 2;
        const centerY = h / 2;
        const roomW = sharedData.roomDimensions.width * scale;
        const roomL = sharedData.roomDimensions.length * scale;
        
        // Floor
        ctx.fillStyle = sharedData.wallPaints.floor.hex;
        ctx.fillRect(centerX - roomW/2, centerY - roomL/2, roomW, roomL);
        
        // Grid
        ctx.strokeStyle = '#D4A574';
        ctx.lineWidth = 1;
        for (let i = 0; i <= sharedData.roomDimensions.width; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX - roomW/2 + i * scale, centerY - roomL/2);
            ctx.lineTo(centerX - roomW/2 + i * scale, centerY + roomL/2);
            ctx.stroke();
        }
        
        // Furniture items
        sharedData.furnitureItems.forEach((item, idx) => {
            const x = centerX + item.position_x * scale;
            const z = centerY + item.position_z * scale;
            ctx.fillStyle = '#D4A574';
            ctx.fillRect(x - 25, z - 25, 50, 50);
            ctx.fillStyle = '#FFF';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.name.substring(0, 10), x, z + 40);
        });
    };
    
    const detectFurniture = async () => {
        if (!photo) {
            alert('No photo available. Please take photos in Measurements tab first.');
            return;
        }
        
        setGenerating(true);
        alert('🔍 Detecting furniture with AI... (Segment Anything)');
        
        // TODO: Call Segment Anything to detect furniture pieces
        setGenerating(false);
    };
    
    const removeSelectedFurniture = async () => {
        alert('🗑️ Removing selected furniture... (Feature coming soon)');
    };
    
    const applyPaint = (wall, color) => {
        const newPaints = { ...sharedData.wallPaints, [wall]: color };
        updateSharedData({ wallPaints: newPaints });
        setShowPaintPicker(false);
        alert('✅ Wall color updated!');
    };
    
    return (
        <div className="h-full flex">
            <div className="w-60 bg-gray-900/30 border-r border-[#D4A574]/30 p-3 overflow-y-auto flex-shrink-0">
                {/* Quick Upload */}
                <div className="mb-4">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleQuickUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-[#D4A574] hover:bg-[#BCA888] text-black font-bold py-2 px-4 rounded mb-2">
                        📷 Quick Upload Photo
                    </button>
                </div>
                
                {/* Room Info */}
                {selectedRoom && (
                    <div className="bg-gray-900/50 rounded p-3 mb-4">
                        <h4 className="text-[#D4A574] font-bold mb-2">📍 Room</h4>
                        <p className="text-[#D4C5A9] text-sm">{selectedRoom.name}</p>
                        <p className="text-gray-400 text-xs">{roomPhotos.length} photos available</p>
                    </div>
                )}
                
                {/* AI Tools */}
                <div className="bg-gray-900/50 rounded p-3 mb-4">
                    <h4 className="text-[#D4A574] font-bold mb-2">🤖 AI Tools</h4>
                    <button onClick={detectFurniture} disabled={generating || !photo} className="w-full bg-[#D4A574] hover:bg-[#BCA888] text-black font-bold px-3 py-2 rounded mb-2 text-sm disabled:opacity-50">
                        🔍 Detect Furniture
                    </button>
                    <button onClick={removeSelectedFurniture} disabled={generating || selectedSegments.length === 0} className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-3 py-2 rounded mb-2 text-sm disabled:opacity-50">
                        🗑️ Remove Selected ({selectedSegments.length})
                    </button>
                </div>
                
                {/* Paint */}
                <div className="bg-gray-900/50 rounded p-3">
                    <h4 className="text-[#D4A574] font-bold mb-2">🎨 Paint</h4>
                    {['front', 'back', 'left', 'right', 'floor'].map(wall => (
                        <button key={wall} onClick={() => { setSelectedWall(wall); setShowPaintPicker(true); }} className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-3 py-2 rounded mb-1 flex items-center justify-between capitalize text-sm">
                            <span>{wall}</span>
                            <div className="w-5 h-5 rounded" style={{ backgroundColor: sharedData.wallPaints[wall].hex }}></div>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 bg-black relative overflow-hidden">
                {photo ? (
                    <img src={photo} alt="Room" className="w-full h-full object-contain" />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-[#D4C5A9] text-xl mb-4">No photos found for this room</p>
                            <p className="text-gray-400">Take photos in the Measurements tab (Mobile App)</p>
                        </div>
                    </div>
                )}
                
                <div className="absolute top-4 left-4 bg-black/70 text-[#D4A574] px-4 py-2 rounded">📐 Flat 3D - Top-Down View</div>
                
                {generating && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-gray-900 p-6 rounded-lg border-2 border-[#D4A574]">
                            <div className="text-[#D4A574] text-xl font-bold">⏳ Processing...</div>
                        </div>
                    </div>
                )}
            </div>
            
            {showPaintPicker && paintCatalog && (
                <div className="absolute inset-y-0 right-0 w-96 bg-gray-900 border-l-2 border-[#D4A574] p-4 overflow-y-auto shadow-2xl z-40">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[#D4A574] font-bold text-lg">Paint {selectedWall}</h3>
                        <button onClick={() => setShowPaintPicker(false)} className="text-gray-400 text-2xl">✕</button>
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                        {Object.keys(paintCatalog.catalogs).map(brand => (
                            <button key={brand} onClick={() => setSelectedBrand(brand)} className={`px-3 py-1 rounded text-xs ${selectedBrand === brand ? 'bg-[#D4A574] text-black' : 'bg-gray-800 text-gray-400'}`}>
                                {brand.split('_')[0].toUpperCase()}
                            </button>
                        ))}
                    </div>
                    
                    {paintCatalog.catalogs[selectedBrand]?.map(color => (
                        <button key={color.code} onClick={() => applyPaint(selectedWall, color)} className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded mb-2 border border-[#D4A574]/20 hover:border-[#D4A574]">
                            <div className="w-12 h-12 rounded" style={{ backgroundColor: color.hex }}></div>
                            <div className="text-left">
                                <div className="text-[#D4C5A9] font-bold">{color.name}</div>
                                <div className="text-gray-400 text-sm">{color.code}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

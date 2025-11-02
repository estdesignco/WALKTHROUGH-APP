import React, { useState, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

export default function DollhouseDocument({ moodboardId, sharedData, updateSharedData, paintCatalog }) {
    const [photo, setPhoto] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [showPaintPicker, setShowPaintPicker] = useState(false);
    const [selectedWall, setSelectedWall] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState('sherwin_williams');
    const fileInputRef = useRef(null);
    
    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('doc_type', 'dollhouse');
        
        try {
            await axios.post(`${BACKEND_URL}/api/moodboards/${moodboardId}/upload-photo?doc_type=dollhouse`, formData);
            
            const reader = new FileReader();
            reader.onload = (e) => setPhoto(e.target.result);
            reader.readAsDataURL(file);
            
            alert('✅ Photo uploaded to Dollhouse document!');
        } catch (error) {
            console.error('Upload failed:', error);
            alert('❌ Upload failed');
        }
    };
    
    const removeFurniture = async () => {
        if (!photo) {
            alert('Please upload a photo first');
            return;
        }
        
        setGenerating(true);
        try {
            const response = await axios.post(`${BACKEND_URL}/api/moodboards/${moodboardId}/ai/remove-furniture`, {
                doc_type: 'dollhouse',
                remove_all: true
            });
            
            // Show actual backend response
            if (response.data.success) {
                alert(`✅ ${response.data.message}\nPrediction ID: ${response.data.prediction_id || 'N/A'}`);
            } else {
                alert(`⚠️ ${response.data.message}`);
            }
        } catch (error) {
            alert('❌ Failed: ' + (error.response?.data?.detail || error.message));
        } finally {
            setGenerating(false);
        }
    };
    
    const recolorWall = async (wall, color) => {
        if (!photo) {
            alert('Please upload a photo first');
            return;
        }
        
        setGenerating(true);
        try {
            await axios.post(`${BACKEND_URL}/api/moodboards/${moodboardId}/ai/recolor-wall`, {
                doc_type: 'dollhouse',
                wall_id: wall,
                hex_color: color.hex
            });
            
            // Update shared data
            const newPaints = { ...sharedData.wallPaints, [wall]: color };
            updateSharedData({ wallPaints: newPaints });
            setShowPaintPicker(false);
            
            alert('✅ Wall color updated! (Full AI recoloring coming soon)');
        } catch (error) {
            alert('❌ Failed: ' + (error.response?.data?.detail || error.message));
        } finally {
            setGenerating(false);
        }
    };
    
    return (
        <div className="h-full flex">
            <div className="w-56 bg-gray-900/30 border-r border-[#D4A574]/30 p-3 overflow-y-auto flex-shrink-0">
                <div className="mb-4">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-[#D4A574] hover:bg-[#BCA888] text-black font-bold py-2 px-4 rounded mb-2">📷 Upload Photo</button>
                </div>
                
                <div className="bg-gray-900/50 rounded p-3 mb-4">
                    <h4 className="text-[#D4A574] font-bold mb-2">🤖 AI Tools</h4>
                    <button onClick={removeFurniture} disabled={generating || !photo} className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-3 py-2 rounded mb-2 text-sm disabled:opacity-50">Remove All Furniture</button>
                </div>
                
                <div className="bg-gray-900/50 rounded p-3 mb-4">
                    <h4 className="text-[#D4A574] font-bold mb-2">🎨 Paint Walls</h4>
                    {['front', 'back', 'left', 'right', 'ceiling', 'floor'].map(wall => (
                        <button key={wall} onClick={() => { setSelectedWall(wall); setShowPaintPicker(true); }} className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-3 py-2 rounded mb-1 flex items-center justify-between capitalize text-sm">
                            <span>{wall}</span>
                            <div className="w-5 h-5 rounded" style={{ backgroundColor: sharedData.wallPaints[wall].hex }}></div>
                        </button>
                    ))}
                </div>
                
                <div className="bg-gray-900/50 rounded p-3">
                    <h4 className="text-[#D4A574] font-bold mb-2">📐 Room</h4>
                    <input type="number" value={sharedData.roomDimensions.length} onChange={(e) => updateSharedData({ roomDimensions: { ...sharedData.roomDimensions, length: parseFloat(e.target.value) || 15 } })} className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm mb-1" placeholder="L (ft)" />
                    <input type="number" value={sharedData.roomDimensions.width} onChange={(e) => updateSharedData({ roomDimensions: { ...sharedData.roomDimensions, width: parseFloat(e.target.value) || 12 } })} className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm mb-1" placeholder="W (ft)" />
                    <input type="number" value={sharedData.roomDimensions.height} onChange={(e) => updateSharedData({ roomDimensions: { ...sharedData.roomDimensions, height: parseFloat(e.target.value) || 10 } })} className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm" placeholder="H (ft)" />
                </div>
            </div>
            
            <div className="flex-1 bg-black relative overflow-hidden">
                {photo ? (
                    <img src={photo} alt="Room" className="w-full h-full object-contain" />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-[#D4C5A9] text-xl mb-4">Upload a room photo to begin</p>
                            <button onClick={() => fileInputRef.current?.click()} className="bg-[#D4A574] hover:bg-[#BCA888] text-black font-bold px-6 py-3 rounded-lg">📷 Upload Photo</button>
                        </div>
                    </div>
                )}
                
                <div className="absolute top-4 left-4 bg-black/70 text-[#D4A574] px-4 py-2 rounded">
                    🏠 3D Dollhouse - AI Photo Editing
                </div>
            </div>
            
            {showPaintPicker && paintCatalog && (
                <div className="absolute inset-y-0 right-0 w-96 bg-gray-900 border-l-2 border-[#D4A574] p-4 overflow-y-auto shadow-2xl z-40">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[#D4A574] font-bold text-lg">🎨 Paint {selectedWall} Wall</h3>
                        <button onClick={() => setShowPaintPicker(false)} className="text-gray-400 hover:text-[#D4A574] text-2xl">✕</button>
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                        {Object.keys(paintCatalog.catalogs).map(brand => (
                            <button key={brand} onClick={() => setSelectedBrand(brand)} className={`px-3 py-1 rounded text-xs ${selectedBrand === brand ? 'bg-[#D4A574] text-black' : 'bg-gray-800 text-gray-400'}`}>
                                {brand.split('_')[0].toUpperCase()}
                            </button>
                        ))}
                    </div>
                    
                    <div className="space-y-2">
                        {paintCatalog.catalogs[selectedBrand]?.map(color => (
                            <button key={color.code} onClick={() => recolorWall(selectedWall, color)} className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded border border-[#D4A574]/20 hover:border-[#D4A574]">
                                <div className="w-12 h-12 rounded" style={{ backgroundColor: color.hex }}></div>
                                <div className="text-left">
                                    <div className="text-[#D4C5A9] font-bold">{color.name}</div>
                                    <div className="text-gray-400 text-sm">{color.code}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

export default function Flat3DDocument({ moodboardId, sharedData, updateSharedData, paintCatalog, roomPhotos, selectedRoom }) {
    const canvasRef = useRef(null);
    const [photo, setPhoto] = useState(null);
    const [photoImage, setPhotoImage] = useState(null);
    const [showPaintPicker, setShowPaintPicker] = useState(false);
    const [selectedWall, setSelectedWall] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState('sherwin_williams');
    const [generating, setGenerating] = useState(false);
    const [furnitureSegments, setFurnitureSegments] = useState([]);
    const [selectedSegments, setSelectedSegments] = useState([]);
    const [detectionComplete, setDetectionComplete] = useState(false);
    const fileInputRef = useRef(null);
    
    useEffect(() => {
        if (roomPhotos && roomPhotos.length > 0) {
            const firstPhoto = roomPhotos[0];
            if (firstPhoto.photo_base64) {
                const photoUrl = `data:image/png;base64,${firstPhoto.photo_base64}`;
                setPhoto(photoUrl);
                loadImageElement(photoUrl);
            }
        }
    }, [roomPhotos]);
    
    const loadImageElement = (url) => {
        const img = new Image();
        img.onload = () => setPhotoImage(img);
        img.src = url;
    };
    
    const handleQuickUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Save to database
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            await axios.post(`${BACKEND_URL}/api/moodboards/${moodboardId}/upload-photo?doc_type=flat3d`, formData);
        } catch (err) {
            console.error('Upload failed:', err);
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            setPhoto(e.target.result);
            loadImageElement(e.target.result);
            setFurnitureSegments([]);
            setSelectedSegments([]);
            setDetectionComplete(false);
        };
        reader.readAsDataURL(file);
    };
    
    const detectFurniture = async () => {
        if (!photo) {
            alert('Please upload a photo first');
            return;
        }
        
        setGenerating(true);
        try {
            const response = await axios.post(`${BACKEND_URL}/api/moodboards/${moodboardId}/ai/detect-furniture`, {
                doc_type: 'flat3d'
            });
            
            if (response.data.success && response.data.prediction_id) {
                const predictionId = response.data.prediction_id;
                alert(`🔍 Detecting furniture... Prediction ID: ${predictionId}`);
                
                // Poll for results
                pollForDetection(predictionId);
            }
        } catch (error) {
            alert('❌ Detection failed: ' + (error.response?.data?.detail || error.message));
            setGenerating(false);
        }
    };
    
    const pollForDetection = async (predictionId) => {
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            
            try {
                const statusResp = await axios.get(`${BACKEND_URL}/api/moodboards/replicate-status/${predictionId}`);
                
                if (statusResp.data.status === 'succeeded') {
                    clearInterval(interval);
                    
                    // Process masks and create segments
                    // SAM returns list of masks
                    const masks = statusResp.data.output || [];
                    const segments = masks.map((mask, idx) => ({
                        id: idx,
                        mask_data: mask,
                        selected: false
                    }));
                    
                    setFurnitureSegments(segments);
                    setDetectionComplete(true);
                    setGenerating(false);
                    alert(`✅ Detected ${segments.length} furniture pieces! Click on them to select.`);
                } else if (statusResp.data.status === 'failed') {
                    clearInterval(interval);
                    setGenerating(false);
                    alert('❌ Detection failed: ' + statusResp.data.error);
                } else if (attempts > 60) {
                    clearInterval(interval);
                    setGenerating(false);
                    alert('⏱️ Detection timeout');
                }
            } catch (err) {
                console.error('Poll error:', err);
            }
        }, 2000);
    };
    
    const removeSelectedFurniture = async () => {
        if (selectedSegments.length === 0) {
            alert('Please select furniture pieces to remove first');
            return;
        }
        
        setGenerating(true);
        try {
            const response = await axios.post(`${BACKEND_URL}/api/moodboards/${moodboardId}/ai/remove-selected-furniture`, {
                doc_type: 'flat3d',
                selected_segments: selectedSegments
            });
            
            if (response.data.success && response.data.prediction_id) {
                const predictionId = response.data.prediction_id;
                alert(`🗑️ Removing ${selectedSegments.length} pieces... Prediction ID: ${predictionId}`);
                
                // Poll for result
                pollForRemoval(predictionId);
            }
        } catch (error) {
            alert('❌ Removal failed: ' + (error.response?.data?.detail || error.message));
            setGenerating(false);
        }
    };
    
    const pollForRemoval = async (predictionId) => {
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            
            try {
                const statusResp = await axios.get(`${BACKEND_URL}/api/moodboards/replicate-status/${predictionId}`);
                
                if (statusResp.data.status === 'succeeded' && statusResp.data.image_base64) {
                    clearInterval(interval);
                    setPhoto(`data:image/png;base64,${statusResp.data.image_base64}`);
                    loadImageElement(`data:image/png;base64,${statusResp.data.image_base64}`);
                    setFurnitureSegments([]);
                    setSelectedSegments([]);
                    setDetectionComplete(false);
                    setGenerating(false);
                    alert('✅ Furniture removed successfully!');
                } else if (statusResp.data.status === 'failed') {
                    clearInterval(interval);
                    setGenerating(false);
                    alert('❌ Removal failed');
                } else if (attempts > 120) {
                    clearInterval(interval);
                    setGenerating(false);
                    alert('⏱️ Timeout');
                }
            } catch (err) {
                console.error('Poll error:', err);
            }
        }, 2000);
    };
    
    const toggleSegmentSelection = (segmentId) => {
        if (selectedSegments.includes(segmentId)) {
            setSelectedSegments(selectedSegments.filter(id => id !== segmentId));
        } else {
            setSelectedSegments([...selectedSegments, segmentId]);
        }
    };
    
    const applyPaint = (wall, color) => {
        const newPaints = { ...sharedData.wallPaints, [wall]: color };
        updateSharedData({ wallPaints: newPaints });
        setShowPaintPicker(false);
        alert('✅ Wall color updated in data! (Visual recolor coming soon)');
    };
    
    return (
        <div className="h-full flex">
            <div className="w-60 bg-gray-900/30 border-r border-[#D4A574]/30 p-3 overflow-y-auto flex-shrink-0">
                <div className="mb-4">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleQuickUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-[#D4A574] hover:bg-[#BCA888] text-black font-bold py-2 px-4 rounded mb-2">
                        📷 Upload Photo
                    </button>
                </div>
                
                {selectedRoom && (
                    <div className="bg-gray-900/50 rounded p-3 mb-4">
                        <h4 className="text-[#D4A574] font-bold mb-2">📍 Room</h4>
                        <p className="text-[#D4C5A9] text-sm">{selectedRoom.name}</p>
                        <p className="text-gray-400 text-xs">{roomPhotos.length} photos</p>
                    </div>
                )}
                
                <div className="bg-gray-900/50 rounded p-3 mb-4">
                    <h4 className="text-[#D4A574] font-bold mb-2">🤖 AI Tools</h4>
                    <button onClick={detectFurniture} disabled={generating || !photo} className="w-full bg-[#D4A574] hover:bg-[#BCA888] text-black font-bold px-3 py-2 rounded mb-2 text-sm disabled:opacity-50">
                        🔍 Detect Furniture
                    </button>
                    <button onClick={removeSelectedFurniture} disabled={generating || selectedSegments.length === 0} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded mb-2 text-sm disabled:opacity-50">
                        🗑️ Remove Selected ({selectedSegments.length})
                    </button>
                </div>
                
                {detectionComplete && furnitureSegments.length > 0 && (
                    <div className="bg-gray-900/50 rounded p-3 mb-4 max-h-64 overflow-y-auto">
                        <h4 className="text-[#D4A574] font-bold mb-2">🛋️ Detected Items ({furnitureSegments.length})</h4>
                        {furnitureSegments.map((seg, idx) => (
                            <div key={idx} onClick={() => toggleSegmentSelection(seg.id)} className={`p-2 rounded mb-1 cursor-pointer text-sm ${
                                selectedSegments.includes(seg.id)
                                    ? 'bg-[#D4A574] text-black font-bold'
                                    : 'bg-gray-800 text-[#D4C5A9] hover:bg-gray-700'
                            }`}>
                                Furniture Piece {idx + 1}
                            </div>
                        ))}
                    </div>
                )}
                
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
                            <p className="text-[#D4C5A9] text-xl mb-4">No photos</p>
                            <p className="text-gray-400">Upload a photo to begin</p>
                        </div>
                    </div>
                )}
                
                <div className="absolute top-4 left-4 bg-black/70 text-[#D4A574] px-4 py-2 rounded">📐 Flat 3D - AI Photo Editor</div>
                
                {generating && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-gray-900 p-6 rounded-lg border-2 border-[#D4A574]">
                            <div className="text-[#D4A574] text-xl font-bold mb-2">⏳ Processing with AI...</div>
                            <div className="text-[#D4C5A9]">This may take 10-30 seconds</div>
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
                        <button key={color.code} onClick={() => {
                            const newPaints = { ...sharedData.wallPaints, [selectedWall]: color };
                            updateSharedData({ wallPaints: newPaints });
                            setShowPaintPicker(false);
                            alert('✅ Color updated in data!');
                        }} className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded mb-2 border border-[#D4A574]/20 hover:border-[#D4A574]">
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

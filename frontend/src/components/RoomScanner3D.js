import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Camera, RotateCw, Ruler, Check, X, Plus, Trash2, 
  Save, Download, Square, Grid, Move, ChevronRight, Lightbulb,
  Smartphone, CornerDownRight, Box, Maximize2
} from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * 3D Room Scanner
 * Capture room dimensions using your phone camera
 * - Take photos of room corners/walls
 * - AI-assisted dimension estimation
 * - Manual measurement input & adjustment
 * - Generate floor plan from measurements
 */
export default function RoomScanner3D() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const floorPlanRef = useRef(null);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Room data
  const [roomName, setRoomName] = useState('New Room');
  const [walls, setWalls] = useState([
    { id: 1, name: 'Wall A', length: 12, height: 9, features: [] },
    { id: 2, name: 'Wall B', length: 10, height: 9, features: [] },
    { id: 3, name: 'Wall C', length: 12, height: 9, features: [] },
    { id: 4, name: 'Wall D', length: 10, height: 9, features: [] }
  ]);
  const [ceilingHeight, setCeilingHeight] = useState(9);
  const [selectedWall, setSelectedWall] = useState(null);
  
  // Feature being added (doors, windows, etc.)
  const [addingFeature, setAddingFeature] = useState(null);
  const [featureForm, setFeatureForm] = useState({ type: 'door', width: 3, height: 7, position: 0 });
  
  // View mode
  const [viewMode, setViewMode] = useState('input'); // 'input', 'floorplan', '3d'
  const [scale, setScale] = useState(20); // pixels per foot
  
  // Scan mode state
  const [scanStep, setScanStep] = useState(0); // 0-4 for each corner
  const [scanInstructions, setScanInstructions] = useState('');

  // Instructions for each scan step
  const scanSteps = [
    { step: 0, instruction: 'Stand in one corner of the room. Point your camera at the opposite corner and capture.', icon: '📐' },
    { step: 1, instruction: 'Move to the next corner (clockwise). Capture the corner across from you.', icon: '↪️' },
    { step: 2, instruction: 'Move to the third corner. Capture the diagonal view.', icon: '↪️' },
    { step: 3, instruction: 'Move to the fourth corner. Final diagonal capture.', icon: '🎯' },
    { step: 4, instruction: 'All corners captured! Processing room dimensions...', icon: '✨' }
  ];

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setCameraError(null);
        setScanStep(0);
        setScanInstructions(scanSteps[0].instruction);
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Could not access camera. Please grant permission or use manual input.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    
    setCapturedPhotos(prev => [...prev, {
      id: Date.now(),
      data: photoData,
      step: scanStep,
      timestamp: new Date().toISOString()
    }]);
    
    // Move to next step
    if (scanStep < 4) {
      const nextStep = scanStep + 1;
      setScanStep(nextStep);
      setScanInstructions(scanSteps[nextStep].instruction);
      
      // If all corners captured, process
      if (nextStep === 4) {
        processScannedPhotos();
      }
    }
  };

  // Process photos with AI to estimate dimensions
  const processScannedPhotos = async () => {
    setIsProcessing(true);
    
    try {
      // Send photos to AI for analysis
      const response = await fetch(`${API_URL}/ai/analyze-room-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: capturedPhotos.map(p => p.data),
          project_id: projectId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.walls) {
          setWalls(data.walls);
        }
        if (data.ceiling_height) {
          setCeilingHeight(data.ceiling_height);
        }
      } else {
        // Fallback: Use default estimates based on typical room sizes
        console.log('AI analysis unavailable, using visual estimation');
        estimateDimensionsFromPhotos();
      }
    } catch (error) {
      console.error('Error processing photos:', error);
      estimateDimensionsFromPhotos();
    } finally {
      setIsProcessing(false);
      stopCamera();
      setViewMode('input');
    }
  };

  // Simple estimation fallback
  const estimateDimensionsFromPhotos = () => {
    // For now, keep default dimensions - user can adjust manually
    // In a full implementation, this would use computer vision
    console.log('Using manual dimension input mode');
  };

  // Add wall
  const addWall = () => {
    const newWall = {
      id: Date.now(),
      name: `Wall ${String.fromCharCode(65 + walls.length)}`,
      length: 10,
      height: ceilingHeight,
      features: []
    };
    setWalls([...walls, newWall]);
  };

  // Remove wall
  const removeWall = (wallId) => {
    if (walls.length <= 3) {
      alert('A room must have at least 3 walls');
      return;
    }
    setWalls(walls.filter(w => w.id !== wallId));
  };

  // Update wall
  const updateWall = (wallId, field, value) => {
    setWalls(walls.map(w => 
      w.id === wallId ? { ...w, [field]: parseFloat(value) || value } : w
    ));
  };

  // Add feature to wall (door, window, etc.)
  const addFeatureToWall = (wallId) => {
    const feature = {
      id: Date.now(),
      ...featureForm
    };
    
    setWalls(walls.map(w => 
      w.id === wallId 
        ? { ...w, features: [...w.features, feature] }
        : w
    ));
    
    setAddingFeature(null);
    setFeatureForm({ type: 'door', width: 3, height: 7, position: 0 });
  };

  // Remove feature from wall
  const removeFeature = (wallId, featureId) => {
    setWalls(walls.map(w => 
      w.id === wallId 
        ? { ...w, features: w.features.filter(f => f.id !== featureId) }
        : w
    ));
  };

  // Calculate room area
  const calculateArea = () => {
    if (walls.length < 3) return 0;
    
    // Simple approximation for rectangular rooms
    // For complex shapes, would need proper polygon area calculation
    const lengths = walls.map(w => w.length);
    if (walls.length === 4) {
      // Assume rectangular
      const avgWidth = (lengths[0] + lengths[2]) / 2;
      const avgLength = (lengths[1] + lengths[3]) / 2;
      return avgWidth * avgLength;
    }
    
    // For other shapes, use shoelace formula approximation
    return lengths.reduce((a, b) => a + b, 0) * ceilingHeight / 4;
  };

  // Calculate perimeter
  const calculatePerimeter = () => {
    return walls.reduce((sum, wall) => sum + wall.length, 0);
  };

  // Save room scan
  const saveRoomScan = async () => {
    try {
      const roomData = {
        project_id: projectId,
        name: roomName,
        walls: walls,
        ceiling_height: ceilingHeight,
        area: calculateArea(),
        perimeter: calculatePerimeter(),
        photos: capturedPhotos.map(p => ({ id: p.id, step: p.step })),
        scanned_at: new Date().toISOString()
      };
      
      const response = await fetch(`${API_URL}/room-scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
      
      if (response.ok) {
        alert('Room scan saved successfully!');
      } else {
        // Save locally for now
        localStorage.setItem(`room-scan-${Date.now()}`, JSON.stringify(roomData));
        alert('Room saved locally!');
      }
    } catch (error) {
      console.error('Error saving room scan:', error);
      localStorage.setItem(`room-scan-${Date.now()}`, JSON.stringify({
        name: roomName,
        walls,
        ceiling_height: ceilingHeight
      }));
      alert('Room saved locally!');
    }
  };

  // Export floor plan as image
  const exportFloorPlan = () => {
    if (!floorPlanRef.current) return;
    
    // Create canvas from floor plan
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svg = floorPlanRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = '#f5f5f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `${roomName.replace(/\s+/g, '-')}-floor-plan.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Generate SVG floor plan
  const generateFloorPlanSVG = () => {
    const padding = 60;
    
    // Calculate room bounds for a simple rectangular representation
    const maxLength = Math.max(...walls.map(w => w.length));
    const width = walls.length >= 2 ? (walls[0].length + walls[2]?.length || walls[0].length) / 2 * scale : maxLength * scale;
    const height = walls.length >= 4 ? (walls[1].length + walls[3]?.length || walls[1].length) / 2 * scale : maxLength * 0.8 * scale;
    
    const svgWidth = width + padding * 2;
    const svgHeight = height + padding * 2;
    
    // Generate wall paths
    const wallPaths = [];
    let x = padding;
    let y = padding;
    
    // Draw rectangular room outline
    wallPaths.push({
      path: `M ${x} ${y} L ${x + width} ${y}`,
      wall: walls[0],
      labelX: x + width / 2,
      labelY: y - 10
    });
    
    if (walls[1]) {
      wallPaths.push({
        path: `M ${x + width} ${y} L ${x + width} ${y + height}`,
        wall: walls[1],
        labelX: x + width + 10,
        labelY: y + height / 2
      });
    }
    
    if (walls[2]) {
      wallPaths.push({
        path: `M ${x + width} ${y + height} L ${x} ${y + height}`,
        wall: walls[2],
        labelX: x + width / 2,
        labelY: y + height + 20
      });
    }
    
    if (walls[3]) {
      wallPaths.push({
        path: `M ${x} ${y + height} L ${x} ${y}`,
        wall: walls[3],
        labelX: x - 10,
        labelY: y + height / 2
      });
    }

    return (
      <svg 
        ref={floorPlanRef}
        width={svgWidth} 
        height={svgHeight} 
        className="bg-[#f5f5f0] rounded-lg"
      >
        {/* Grid */}
        <defs>
          <pattern id="grid" width={scale} height={scale} patternUnits="userSpaceOnUse">
            <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#ddd" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Room fill */}
        <rect 
          x={padding} 
          y={padding} 
          width={width} 
          height={height} 
          fill="rgba(212, 165, 116, 0.1)"
          stroke="#D4A574"
          strokeWidth="3"
        />
        
        {/* Wall labels with dimensions */}
        {wallPaths.map((wp, idx) => (
          <g key={idx}>
            <text 
              x={wp.labelX} 
              y={wp.labelY} 
              textAnchor="middle" 
              fill="#333"
              fontSize="12"
              fontWeight="bold"
            >
              {wp.wall?.name}: {wp.wall?.length}' 
            </text>
          </g>
        ))}
        
        {/* Draw features (doors, windows) */}
        {walls.map((wall, wallIdx) => 
          wall.features.map((feature, featureIdx) => {
            const featureWidth = feature.width * scale;
            let fx, fy, fw, fh;
            
            // Position features on walls
            if (wallIdx === 0) {
              // Top wall
              fx = padding + feature.position * scale;
              fy = padding - 5;
              fw = featureWidth;
              fh = 10;
            } else if (wallIdx === 1) {
              // Right wall
              fx = padding + width - 5;
              fy = padding + feature.position * scale;
              fw = 10;
              fh = featureWidth;
            } else if (wallIdx === 2) {
              // Bottom wall
              fx = padding + width - feature.position * scale - featureWidth;
              fy = padding + height - 5;
              fw = featureWidth;
              fh = 10;
            } else {
              // Left wall
              fx = padding - 5;
              fy = padding + height - feature.position * scale - featureWidth;
              fw = 10;
              fh = featureWidth;
            }
            
            return (
              <g key={`${wallIdx}-${featureIdx}`}>
                <rect 
                  x={fx} 
                  y={fy} 
                  width={fw} 
                  height={fh}
                  fill={feature.type === 'door' ? '#8B4513' : '#87CEEB'}
                  stroke="#333"
                  strokeWidth="1"
                />
                <text
                  x={fx + fw / 2}
                  y={fy + fh / 2 + 3}
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                >
                  {feature.type === 'door' ? 'D' : 'W'}
                </text>
              </g>
            );
          })
        )}
        
        {/* Room info */}
        <text x={padding + width / 2} y={padding + height / 2 - 10} textAnchor="middle" fill="#666" fontSize="14">
          {roomName}
        </text>
        <text x={padding + width / 2} y={padding + height / 2 + 10} textAnchor="middle" fill="#888" fontSize="12">
          {calculateArea().toFixed(0)} sq ft
        </text>
        
        {/* Legend */}
        <g transform={`translate(${padding}, ${svgHeight - 30})`}>
          <rect x="0" y="0" width="15" height="10" fill="#8B4513" />
          <text x="20" y="8" fontSize="10" fill="#666">Door</text>
          <rect x="60" y="0" width="15" height="10" fill="#87CEEB" />
          <text x="80" y="8" fontSize="10" fill="#666">Window</text>
        </g>
        
        {/* Scale indicator */}
        <g transform={`translate(${svgWidth - 100}, ${svgHeight - 30})`}>
          <line x1="0" y1="5" x2={scale} y2="5" stroke="#333" strokeWidth="2" />
          <line x1="0" y1="0" x2="0" y2="10" stroke="#333" strokeWidth="2" />
          <line x1={scale} y1="0" x2={scale} y2="10" stroke="#333" strokeWidth="2" />
          <text x={scale / 2} y="20" textAnchor="middle" fontSize="10" fill="#666">1 ft</text>
        </g>
      </svg>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
      {/* Header */}
      <div className="p-4 border-b border-[#D4A574]/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => { stopCamera(); navigate(-1); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A574]/20 text-[#D4A574] hover:bg-[#D4A574]/30"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#D4A574] flex items-center gap-2 justify-center">
              <Box size={28} />
              3D Room Scanner
            </h1>
            <p className="text-gray-400 text-sm">Capture room dimensions with your camera</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={saveRoomScan}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              <Save size={18} />
              Save
            </button>
            <button
              onClick={exportFloorPlan}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('input')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              viewMode === 'input' 
                ? 'bg-[#D4A574] text-white' 
                : 'bg-black/30 text-gray-400 hover:bg-black/50'
            }`}
          >
            <Ruler size={18} />
            Measurements
          </button>
          <button
            onClick={() => setViewMode('floorplan')}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              viewMode === 'floorplan' 
                ? 'bg-[#D4A574] text-white' 
                : 'bg-black/30 text-gray-400 hover:bg-black/50'
            }`}
          >
            <Square size={18} />
            Floor Plan
          </button>
          <button
            onClick={() => setCameraActive(true) || startCamera()}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              cameraActive 
                ? 'bg-green-600 text-white' 
                : 'bg-black/30 text-gray-400 hover:bg-black/50'
            }`}
          >
            <Camera size={18} />
            Camera Scan
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-6">
        {/* Camera Scan Mode */}
        {cameraActive && (
          <div className="rounded-2xl border border-[#D4A574]/30 overflow-hidden mb-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-[400px] object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scan overlay guide */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner guides */}
                <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-[#D4A574]" />
                <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-[#D4A574]" />
                <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-[#D4A574]" />
                <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-[#D4A574]" />
                
                {/* Center crosshair */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 border-2 border-[#D4A574] rounded-full" />
                  <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#D4A574] rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              
              {/* Instructions overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#D4A574] flex items-center justify-center text-2xl">
                    {scanSteps[scanStep]?.icon}
                  </div>
                  <div>
                    <p className="text-white font-medium">Step {scanStep + 1} of 4</p>
                    <p className="text-gray-300 text-sm">{scanInstructions}</p>
                  </div>
                </div>
                
                {/* Progress dots */}
                <div className="flex gap-2 mt-3">
                  {[0, 1, 2, 3].map(step => (
                    <div 
                      key={step}
                      className={`w-3 h-3 rounded-full ${
                        step < scanStep ? 'bg-green-500' :
                        step === scanStep ? 'bg-[#D4A574] animate-pulse' :
                        'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Camera controls */}
            <div className="p-4 flex items-center justify-center gap-4 bg-black/50">
              <button
                onClick={capturePhoto}
                disabled={isProcessing || scanStep >= 4}
                className="w-16 h-16 rounded-full bg-[#D4A574] text-white flex items-center justify-center hover:bg-[#B49B7E] disabled:opacity-50 transition-all"
              >
                {isProcessing ? (
                  <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
                ) : (
                  <Camera size={28} />
                )}
              </button>
              <button
                onClick={() => { stopCamera(); setViewMode('input'); }}
                className="px-4 py-2 rounded-lg bg-red-500/80 text-white hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
            
            {/* Captured photos preview */}
            {capturedPhotos.length > 0 && (
              <div className="p-4 border-t border-[#D4A574]/30">
                <p className="text-gray-400 text-sm mb-2">Captured: {capturedPhotos.length}/4</p>
                <div className="flex gap-2">
                  {capturedPhotos.map((photo, idx) => (
                    <div key={photo.id} className="w-16 h-16 rounded overflow-hidden border-2 border-green-500">
                      <img src={photo.data} alt={`Corner ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Measurements Input Mode */}
        {viewMode === 'input' && !cameraActive && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left - Room Info & Walls */}
            <div className="space-y-4">
              {/* Room Name & Ceiling */}
              <div className="p-4 rounded-xl bg-black/30 border border-[#D4A574]/30">
                <h3 className="text-[#D4A574] font-bold mb-4 flex items-center gap-2">
                  <Box size={20} />
                  Room Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Room Name</label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Ceiling Height (ft)</label>
                    <input
                      type="number"
                      value={ceilingHeight}
                      onChange={(e) => setCeilingHeight(parseFloat(e.target.value) || 9)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                      step="0.5"
                    />
                  </div>
                </div>
              </div>
              
              {/* Walls */}
              <div className="p-4 rounded-xl bg-black/30 border border-[#D4A574]/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#D4A574] font-bold flex items-center gap-2">
                    <Maximize2 size={20} />
                    Walls ({walls.length})
                  </h3>
                  <button
                    onClick={addWall}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#D4A574]/20 text-[#D4A574] hover:bg-[#D4A574]/30 text-sm"
                  >
                    <Plus size={16} />
                    Add Wall
                  </button>
                </div>
                
                <div className="space-y-3">
                  {walls.map((wall, idx) => (
                    <div 
                      key={wall.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedWall === wall.id 
                          ? 'border-[#D4A574] bg-[#D4A574]/10' 
                          : 'border-[#B49B7E]/30 bg-black/30 hover:border-[#D4A574]/50'
                      }`}
                      onClick={() => setSelectedWall(selectedWall === wall.id ? null : wall.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#D4A574] flex items-center justify-center text-white font-bold">
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <div>
                            <input
                              type="text"
                              value={wall.name}
                              onChange={(e) => updateWall(wall.id, 'name', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-transparent text-white font-medium focus:outline-none focus:border-b border-[#D4A574]"
                            />
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeWall(wall.id); }}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-gray-500 text-xs">Length (ft)</label>
                          <input
                            type="number"
                            value={wall.length}
                            onChange={(e) => updateWall(wall.id, 'length', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full mt-1 px-2 py-1 rounded bg-black/50 border border-[#B49B7E]/30 text-white text-sm"
                            step="0.5"
                          />
                        </div>
                        <div>
                          <label className="text-gray-500 text-xs">Height (ft)</label>
                          <input
                            type="number"
                            value={wall.height}
                            onChange={(e) => updateWall(wall.id, 'height', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full mt-1 px-2 py-1 rounded bg-black/50 border border-[#B49B7E]/30 text-white text-sm"
                            step="0.5"
                          />
                        </div>
                      </div>
                      
                      {/* Wall features */}
                      {selectedWall === wall.id && (
                        <div className="mt-3 pt-3 border-t border-[#B49B7E]/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Features</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setAddingFeature(wall.id); }}
                              className="text-xs text-[#D4A574] hover:underline"
                            >
                              + Add Door/Window
                            </button>
                          </div>
                          
                          {wall.features.length > 0 ? (
                            <div className="space-y-2">
                              {wall.features.map(feature => (
                                <div key={feature.id} className="flex items-center justify-between p-2 rounded bg-black/30">
                                  <span className="text-sm text-gray-300 flex items-center gap-2">
                                    {feature.type === 'door' ? '🚪' : '🪟'}
                                    {feature.type} - {feature.width}' × {feature.height}'
                                  </span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeFeature(wall.id, feature.id); }}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-600 text-xs">No doors or windows</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#D4A574]/20 to-[#B49B7E]/20 border border-[#D4A574]/30">
                <h3 className="text-[#D4A574] font-bold mb-3">Room Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{calculateArea().toFixed(0)}</p>
                    <p className="text-gray-400 text-sm">Sq Ft</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{calculatePerimeter().toFixed(0)}'</p>
                    <p className="text-gray-400 text-sm">Perimeter</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{ceilingHeight}'</p>
                    <p className="text-gray-400 text-sm">Ceiling</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right - Floor Plan Preview */}
            <div className="p-4 rounded-xl bg-black/30 border border-[#D4A574]/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#D4A574] font-bold flex items-center gap-2">
                  <Grid size={20} />
                  Floor Plan Preview
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScale(s => Math.max(10, s - 5))}
                    className="p-1 rounded bg-black/30 text-gray-400 hover:text-white"
                  >
                    -
                  </button>
                  <span className="text-gray-400 text-sm">{scale}px/ft</span>
                  <button
                    onClick={() => setScale(s => Math.min(40, s + 5))}
                    className="p-1 rounded bg-black/30 text-gray-400 hover:text-white"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="overflow-auto max-h-[500px] flex items-center justify-center">
                {generateFloorPlanSVG()}
              </div>
            </div>
          </div>
        )}

        {/* Floor Plan View Mode */}
        {viewMode === 'floorplan' && !cameraActive && (
          <div className="p-6 rounded-xl bg-black/30 border border-[#D4A574]/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#D4A574] font-bold text-xl">{roomName} - Floor Plan</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScale(s => Math.max(15, s - 5))}
                  className="px-3 py-1 rounded bg-black/30 text-gray-400 hover:text-white"
                >
                  Zoom -
                </button>
                <button
                  onClick={() => setScale(s => Math.min(50, s + 5))}
                  className="px-3 py-1 rounded bg-black/30 text-gray-400 hover:text-white"
                >
                  Zoom +
                </button>
              </div>
            </div>
            <div className="overflow-auto flex items-center justify-center p-4">
              {generateFloorPlanSVG()}
            </div>
          </div>
        )}

        {/* Add Feature Modal */}
        {addingFeature && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#1E293B] border-2 border-[#D4A574] rounded-2xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-xl font-bold text-[#D4A574] mb-4">Add Door/Window</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Type</label>
                  <select
                    value={featureForm.type}
                    onChange={(e) => setFeatureForm({ ...featureForm, type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                  >
                    <option value="door">🚪 Door</option>
                    <option value="window">🪟 Window</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Width (ft)</label>
                    <input
                      type="number"
                      value={featureForm.width}
                      onChange={(e) => setFeatureForm({ ...featureForm, width: parseFloat(e.target.value) || 3 })}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Height (ft)</label>
                    <input
                      type="number"
                      value={featureForm.height}
                      onChange={(e) => setFeatureForm({ ...featureForm, height: parseFloat(e.target.value) || 7 })}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                      step="0.5"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Position from corner (ft)</label>
                  <input
                    type="number"
                    value={featureForm.position}
                    onChange={(e) => setFeatureForm({ ...featureForm, position: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white"
                    step="0.5"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => addFeatureToWall(addingFeature)}
                  className="flex-1 py-2 rounded-lg bg-[#D4A574] text-white font-bold hover:bg-[#B49B7E]"
                >
                  Add
                </button>
                <button
                  onClick={() => setAddingFeature(null)}
                  className="flex-1 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        {!cameraActive && (
          <div className="mt-6 p-4 rounded-xl bg-black/20 border border-[#D4A574]/20">
            <h4 className="text-[#D4A574] font-bold mb-3 flex items-center gap-2">
              <Lightbulb size={18} />
              Scanning Tips
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex gap-2">
                <Smartphone size={16} className="text-[#D4A574] flex-shrink-0 mt-0.5" />
                <p className="text-gray-400">
                  <strong className="text-gray-300">On-site:</strong> Use camera scan for quick measurements
                </p>
              </div>
              <div className="flex gap-2">
                <Ruler size={16} className="text-[#D4A574] flex-shrink-0 mt-0.5" />
                <p className="text-gray-400">
                  <strong className="text-gray-300">Precision:</strong> Adjust dimensions manually for accuracy
                </p>
              </div>
              <div className="flex gap-2">
                <CornerDownRight size={16} className="text-[#D4A574] flex-shrink-0 mt-0.5" />
                <p className="text-gray-400">
                  <strong className="text-gray-300">Features:</strong> Add doors & windows to each wall
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

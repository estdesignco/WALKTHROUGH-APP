import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, RotateCw, Move, ZoomIn, ZoomOut, Check, X } from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * AR Furniture Preview
 * See your FFE items in real space using camera
 * - Uses device camera
 * - Overlays furniture from your FFE
 * - Drag to position, pinch to scale, rotate
 */
export default function ARFurniturePreview() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [ffeItems, setFfeItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [placedItems, setPlacedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Placement state
  const [currentPlacement, setCurrentPlacement] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Load FFE items
  useEffect(() => {
    loadFFEItems();
  }, [projectId]);

  const loadFFEItems = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`);
      if (response.ok) {
        const project = await response.json();
        
        // Extract items with images
        const items = [];
        project.rooms?.forEach(room => {
          room.categories?.forEach(category => {
            category.subcategories?.forEach(subcategory => {
              subcategory.items?.forEach(item => {
                if (item.image_url) {
                  items.push({
                    id: item.id,
                    name: item.name,
                    category: category.name,
                    room: room.name,
                    image_url: item.image_url,
                    size: item.size || 'Standard'
                  });
                }
              });
            });
          });
        });
        
        setFfeItems(items);
      }
    } catch (error) {
      console.error('Failed to load FFE items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera for AR
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setCameraError(null);
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Could not access camera. Please grant permission.');
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
    return () => stopCamera(); // Cleanup on unmount
  }, []);

  // Add item to AR view
  const addItemToAR = (item) => {
    setCurrentPlacement({
      ...item,
      placementId: `${item.id}-${Date.now()}`,
      x: 50, // percentage from left
      y: 50, // percentage from top
      scale: 0.3,
      rotation: 0
    });
    setSelectedItem(item.id);
    setScale(0.3);
    setRotation(0);
  };

  // Confirm placement
  const confirmPlacement = () => {
    if (currentPlacement) {
      setPlacedItems(prev => [...prev, { ...currentPlacement, scale, rotation }]);
      setCurrentPlacement(null);
      setSelectedItem(null);
    }
  };

  // Cancel placement
  const cancelPlacement = () => {
    setCurrentPlacement(null);
    setSelectedItem(null);
  };

  // Remove placed item
  const removePlacedItem = (placementId) => {
    setPlacedItems(prev => prev.filter(item => item.placementId !== placementId));
  };

  // Handle touch/mouse events for dragging
  const handlePointerDown = (e) => {
    if (currentPlacement) {
      setDragging(true);
    }
  };

  const handlePointerMove = (e) => {
    if (dragging && currentPlacement && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setCurrentPlacement(prev => ({
        ...prev,
        x: Math.max(10, Math.min(90, x)),
        y: Math.max(10, Math.min(90, y))
      }));
    }
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  // Capture screenshot
  const captureScreenshot = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame
    ctx.drawImage(video, 0, 0);
    
    // Draw placed furniture (simplified - in production use proper image compositing)
    // This would need more sophisticated rendering
    
    // Download
    const link = document.createElement('a');
    link.download = `ar-preview-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
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
            <h1 className="text-2xl font-bold text-[#D4A574]">📱 AR Furniture Preview</h1>
            <p className="text-gray-400 text-sm">See your FFE items in real space</p>
          </div>
          
          <div className="w-24" /> {/* Spacer */}
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left - FFE Items Panel */}
        <div className="w-72 border-r border-[#D4A574]/30 overflow-y-auto p-4">
          <h2 className="text-[#D4A574] font-bold mb-4">Your Furniture</h2>
          <p className="text-gray-500 text-sm mb-4">
            Select items to preview in AR
          </p>
          
          {loading ? (
            <p className="text-gray-500">Loading items...</p>
          ) : ffeItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No items with images found</p>
              <p className="text-gray-600 text-sm">Add images to your FFE items to preview them in AR</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ffeItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => cameraActive && addItemToAR(item)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedItem === item.id
                      ? 'border-[#D4A574] bg-[#D4A574]/20'
                      : 'border-[#B49B7E]/30 bg-black/30 hover:border-[#D4A574]/50'
                  } ${!cameraActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.name}</p>
                      <p className="text-gray-500 text-xs">{item.category}</p>
                      <p className="text-gray-600 text-xs">{item.room}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main - Camera View */}
        <div className="flex-1 relative">
          {!cameraActive ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {cameraError ? (
                  <>
                    <p className="text-red-400 mb-4">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 rounded-xl bg-[#D4A574] text-white font-bold hover:bg-[#B49B7E] transition-colors"
                    >
                      Try Again
                    </button>
                  </>
                ) : (
                  <>
                    <Camera size={64} className="mx-auto text-[#D4A574] mb-4" />
                    <h2 className="text-white text-xl font-bold mb-2">Start AR Preview</h2>
                    <p className="text-gray-400 mb-6">Point your camera at the room to preview furniture</p>
                    <button
                      onClick={startCamera}
                      className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#D4A574] to-[#B49B7E] text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
                    >
                      <Camera size={24} />
                      Open Camera
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div 
              ref={containerRef}
              className="relative w-full h-full"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* Camera Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Hidden canvas for screenshots */}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Placed Items */}
              {placedItems.map(item => (
                <div
                  key={item.placementId}
                  className="absolute cursor-pointer group"
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)`
                  }}
                  onClick={() => removePlacedItem(item.placementId)}
                >
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="max-w-xs rounded shadow-2xl"
                    style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
                  />
                  <div className="absolute inset-0 bg-red-500/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-opacity">
                    <X size={32} className="text-white" />
                  </div>
                </div>
              ))}
              
              {/* Current Placement (being positioned) */}
              {currentPlacement && (
                <div
                  className="absolute cursor-move"
                  style={{
                    left: `${currentPlacement.x}%`,
                    top: `${currentPlacement.y}%`,
                    transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`
                  }}
                >
                  <img 
                    src={currentPlacement.image_url} 
                    alt={currentPlacement.name}
                    className="max-w-xs rounded shadow-2xl border-2 border-[#D4A574]"
                    style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
                  />
                  <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#D4A574] rounded-full flex items-center justify-center">
                    <Move size={14} className="text-white" />
                  </div>
                </div>
              )}
              
              {/* Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 p-3 rounded-2xl bg-black/70 backdrop-blur">
                {currentPlacement ? (
                  <>
                    {/* Scale Controls */}
                    <button
                      onClick={() => setScale(s => Math.max(0.1, s - 0.1))}
                      className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                      <ZoomOut size={20} />
                    </button>
                    <span className="text-white text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
                    <button
                      onClick={() => setScale(s => Math.min(2, s + 0.1))}
                      className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                      <ZoomIn size={20} />
                    </button>
                    
                    <div className="w-px h-8 bg-white/30 mx-2" />
                    
                    {/* Rotation */}
                    <button
                      onClick={() => setRotation(r => (r + 45) % 360)}
                      className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                      <RotateCw size={20} />
                    </button>
                    
                    <div className="w-px h-8 bg-white/30 mx-2" />
                    
                    {/* Confirm/Cancel */}
                    <button
                      onClick={confirmPlacement}
                      className="p-3 rounded-full bg-green-500 text-white hover:bg-green-600"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={cancelPlacement}
                      className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={captureScreenshot}
                      className="px-6 py-3 rounded-full bg-[#D4A574] text-white font-bold hover:bg-[#B49B7E] transition-colors flex items-center gap-2"
                    >
                      <Camera size={20} />
                      Capture
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-3 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                    >
                      Stop Camera
                    </button>
                  </>
                )}
              </div>
              
              {/* Placed items count */}
              {placedItems.length > 0 && !currentPlacement && (
                <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-black/70 text-white text-sm">
                  {placedItems.length} item{placedItems.length !== 1 ? 's' : ''} placed
                </div>
              )}
              
              {/* Instructions */}
              {!currentPlacement && placedItems.length === 0 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full bg-black/70 text-white text-sm">
                  Select furniture from the left panel to place it
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

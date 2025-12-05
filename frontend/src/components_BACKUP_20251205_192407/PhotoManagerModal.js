import React, { useState, useRef, useEffect } from 'react';

const PhotoManagerModal = ({ 
  room, 
  photos = [], 
  onClose, 
  onSavePhotos,
  leicaConnected,
  onConnectLeica 
}) => {
  const [roomPhotos, setRoomPhotos] = useState(photos);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [currentArrow, setCurrentArrow] = useState(null);

  // Handle photo upload
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newPhoto = {
          id: Date.now() + Math.random(),
          data: event.target.result,
          measurements: [],
          timestamp: new Date().toISOString()
        };
        setRoomPhotos(prev => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start drawing arrow
  const startDrawing = (e) => {
    if (!isAnnotating || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDrawing(true);
    setCurrentArrow({ startX: x, startY: y, endX: x, endY: y });
  };

  // Continue drawing arrow
  const continueDrawing = (e) => {
    if (!drawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentArrow(prev => ({ ...prev, endX: x, endY: y }));
    
    // Redraw canvas
    drawCanvas();
  };

  // Finish drawing arrow and request Leica measurement
  const finishDrawing = async () => {
    if (!drawing || !currentArrow) return;
    
    setDrawing(false);
    
    // Request measurement from Leica D5
    if (leicaConnected) {
      try {
        // TODO: Call Leica D5 API to get measurement
        const measurement = await requestLeicaMeasurement();
        
        const newMeasurement = {
          ...currentArrow,
          value: measurement,
          id: Date.now()
        };
        
        setMeasurements(prev => [...prev, newMeasurement]);
      } catch (error) {
        console.error('Failed to get Leica measurement:', error);
        alert('Failed to get measurement from Leica D5. Please try again.');
      }
    } else {
      // Manual measurement input if Leica not connected
      const value = prompt('Enter measurement:');
      if (value) {
        const newMeasurement = {
          ...currentArrow,
          value: value,
          id: Date.now()
        };
        setMeasurements(prev => [...prev, newMeasurement]);
      }
    }
    
    setCurrentArrow(null);
  };

  // Request measurement from Leica D5 via Bluetooth
  const requestLeicaMeasurement = async () => {
    // TODO: Implement Leica D5 Bluetooth API call
    // This will communicate with the Leica D5 device via Bluetooth
    // and return the measurement value
    
    return new Promise((resolve) => {
      // Simulated for now - replace with actual Bluetooth API
      setTimeout(() => {
        resolve('12.5 ft');
      }, 1000);
    });
  };

  // Draw canvas with image, arrows, and measurements
  const drawCanvas = () => {
    if (!canvasRef.current || !selectedPhoto) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    const img = new Image();
    img.src = selectedPhoto.data;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw existing measurements
      measurements.forEach(m => {
        drawArrow(ctx, m.startX, m.startY, m.endX, m.endY, m.value);
      });
      
      // Draw current arrow being drawn
      if (currentArrow && drawing) {
        drawArrow(ctx, currentArrow.startX, currentArrow.startY, currentArrow.endX, currentArrow.endY, '');
      }
    };
  };

  // Draw arrow with measurement label
  const drawArrow = (ctx, fromX, fromY, toX, toY, label) => {
    const headlen = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Draw line
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    
    // Draw label
    if (label) {
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      ctx.strokeText(label, midX + 10, midY - 10);
      ctx.fillText(label, midX + 10, midY - 10);
    }
  };

  // Save current photo with measurements
  const savePhotoAnnotations = () => {
    if (!selectedPhoto) return;
    
    const updatedPhoto = {
      ...selectedPhoto,
      measurements: measurements
    };
    
    setRoomPhotos(prev => 
      prev.map(p => p.id === selectedPhoto.id ? updatedPhoto : p)
    );
    
    setSelectedPhoto(null);
    setIsAnnotating(false);
    setMeasurements([]);
  };

  // Save all photos for this room
  const handleSave = () => {
    onSavePhotos(room.id, roomPhotos);
    onClose();
  };

  useEffect(() => {
    if (selectedPhoto && isAnnotating) {
      drawCanvas();
    }
  }, [selectedPhoto, isAnnotating, measurements, currentArrow]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl max-w-6xl w-full mt-4 border border-[#D4A574]">
        {/* Header */}
        <div className="p-6 border-b border-[#D4A574]/30">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#D4A574]">
              📸 {room.name} - Photos
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Leica Status */}
          <div className="mt-4 flex items-center gap-4">
            <div className={`text-sm ${leicaConnected ? 'text-green-400' : 'text-red-400'}`}>
              Leica D5: {leicaConnected ? '✓ Connected' : '✗ Not Connected'}
            </div>
            {!leicaConnected && (
              <button
                onClick={onConnectLeica}
                className="px-3 py-1 bg-[#D4A574] hover:bg-[#C49564] text-black rounded text-sm font-medium"
              >
                Connect Leica D5
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedPhoto ? (
            // Photo Grid View
            <div>
              <div className="mb-4 flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#D4A574] hover:bg-[#C49564] text-black rounded font-medium"
                >
                  📷 Take/Upload Photos
                </button>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {roomPhotos.map(photo => (
                  <div
                    key={photo.id}
                    className="relative cursor-pointer group"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.data}
                      alt="Room"
                      className="w-full h-40 object-cover rounded border border-[#D4A574]/50"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {photo.measurements?.length || 0} measurements
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRoomPhotos(prev => prev.filter(p => p.id !== photo.id));
                      }}
                      className="absolute top-2 left-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {roomPhotos.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                  No photos yet. Click "Take/Upload Photos" to add photos for this room.
                </div>
              )}
            </div>
          ) : (
            // Photo Annotation View
            <div>
              <div className="mb-4 flex gap-3 items-center">
                <button
                  onClick={() => {
                    setSelectedPhoto(null);
                    setIsAnnotating(false);
                    setMeasurements([]);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                >
                  ← Back to Grid
                </button>
                
                <button
                  onClick={() => {
                    setIsAnnotating(!isAnnotating);
                    if (isAnnotating) {
                      savePhotoAnnotations();
                    } else {
                      setMeasurements(selectedPhoto.measurements || []);
                    }
                  }}
                  className={`px-4 py-2 rounded font-medium ${
                    isAnnotating 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-[#D4A574] hover:bg-[#C49564] text-black'
                  }`}
                >
                  {isAnnotating ? '✓ Save Annotations' : '✏️ Add Measurements'}
                </button>

                {isAnnotating && (
                  <div className="text-sm text-[#D4A574]">
                    Draw arrows with your finger/mouse, then {leicaConnected ? 'laser point and measure with Leica D5' : 'enter measurement manually'}
                  </div>
                )}
              </div>

              {/* Canvas for annotation */}
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full border border-[#D4A574] rounded cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={continueDrawing}
                  onMouseUp={finishDrawing}
                  onTouchStart={(e) => startDrawing(e.touches[0])}
                  onTouchMove={(e) => continueDrawing(e.touches[0])}
                  onTouchEnd={finishDrawing}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#D4A574]/30 flex justify-between">
          <div className="text-[#D4C5A9]">
            {roomPhotos.length} photos • {roomPhotos.reduce((sum, p) => sum + (p.measurements?.length || 0), 0)} measurements
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#D4A574] hover:bg-[#C49564] text-black rounded font-medium"
            >
              Save Photos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoManagerModal;
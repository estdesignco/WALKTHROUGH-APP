import React, { useState, useRef } from 'react';
import axios from 'axios';
import { leicaManager } from '../utils/leicaD5Manager';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MobilePhotoCapture({ projectId, roomId, onPhotoAdded, onClose }) {
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [measurements, setMeasurements] = useState([]); // Now stores {x1, y1, x2, y2, text}
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [measurementText, setMeasurementText] = useState('');
  const [leicaConnected, setLeicaConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [lastMeasurement, setLastMeasurement] = useState(null);
  const [drawingArrow, setDrawingArrow] = useState(null); // {x1, y1, x2, y2} while drawing
  const [editingArrowIndex, setEditingArrowIndex] = useState(null); // Which arrow is being edited
  const [arrowColor, setArrowColor] = useState('#FFD700'); // Current arrow color (gold default)
  const [drawMode, setDrawMode] = useState(false); // Explicit draw mode
  const [showControls, setShowControls] = useState(false); // Show/hide control panel
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedPhoto(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Connect to Leica D5
  const connectLeica = async () => {
    const browserInfo = leicaManager.getBrowserCompatibilityInfo();
    
    if (!leicaManager.isSupported()) {
      let message = '❌ WEB BLUETOOTH NOT SUPPORTED\n\n';
      
      if (browserInfo.isChromeOnIOS) {
        message += '⚠️ CHROME ON iPAD USES SAFARI ENGINE\n\n';
        message += 'Web Bluetooth does NOT work on iOS/iPadOS\n';
        message += '(This is an Apple limitation, not a Chrome issue)\n\n';
        message += '✅ TO USE LEICA D5:\n';
        message += '• Use Chrome on Android tablet/phone\n';
        message += '• Use Chrome on Windows/Mac desktop\n\n';
        message += '❌ Will NOT work on ANY iPad browser\n';
        message += '❌ Will NOT work on Safari on any device';
      } else if (browserInfo.isSafari) {
        message += '⚠️ Safari does NOT support Web Bluetooth\n\n';
        message += '✅ Please use Chrome or Edge browser';
      } else {
        message += '✅ Please use:\n• Chrome on Android\n• Chrome/Edge on desktop';
      }
      
      alert(message);
      return;
    }

    try {
      setConnecting(true);
      
      console.log('🔍 Starting Leica D5 connection process...');
      
      // Simple connection without complex retry logic first
      const result = await leicaManager.connect();
      
      setLeicaConnected(true);
      alert(`✅ CONNECTED TO LEICA D5!\n\nDevice: ${result.deviceName}\n\nPress the measurement button on your Leica to take readings.`);

      // Set up measurement callback
      leicaManager.setOnMeasurement((measurement) => {
        console.log('📏 NEW MEASUREMENT FROM LEICA:', measurement);
        setLastMeasurement(measurement);
        setMeasurementText(measurement.feetInches);
        
        // Show visual feedback
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                      background: linear-gradient(135deg, #4ade80, #22c55e); 
                      color: white; padding: 20px; border-radius: 12px; 
                      z-index: 9999; font-weight: bold; font-size: 18px;
                      box-shadow: 0 10px 30px rgba(34, 197, 94, 0.5);">
            📏 NEW MEASUREMENT: ${measurement.feetInches}
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      });

    } catch (error) {
      console.error('❌ Leica connection error:', error);
      
      let errorMsg = `❌ FAILED TO CONNECT TO LEICA D5\n\n`;
      
      if (error.message.includes('User cancelled')) {
        errorMsg = '⚠️ Connection cancelled by user.\n\nTip: Make sure to select your DISTO device when prompted.';
      } else if (error.message.includes('timeout')) {
        errorMsg += `⏱ CONNECTION TIMEOUT\n\n`;
        errorMsg += `🔧 Quick Fixes:\n`;
        errorMsg += `1. Turn Leica D5 OFF → Wait 5 seconds → Turn ON\n`;
        errorMsg += `2. Move device closer (< 5 feet from your device)\n`;
        errorMsg += `3. Make sure no other device is connected to the Leica\n`;
        errorMsg += `4. Try again (first connection may take 30-90 seconds)\n\n`;
        errorMsg += `💡 Once paired successfully, reconnection is much faster!`;
      } else if (error.message.includes('not found') || error.message.includes('No device')) {
        errorMsg += `🔍 DEVICE NOT FOUND\n\n`;
        errorMsg += `📋 Checklist:\n`;
        errorMsg += `✓ Leica D5 is powered ON\n`;
        errorMsg += `✓ Leica is in pairing mode (check manual)\n`;
        errorMsg += `✓ Leica is not connected to another device\n`;
        errorMsg += `✓ You're within 10 feet of the Leica\n`;
        errorMsg += `✓ Your device's Bluetooth is enabled\n\n`;
        errorMsg += `🔄 If still not working, restart both devices`;
      } else {
        errorMsg += `Error: ${error.message}\n\n`;
        errorMsg += `📋 General Troubleshooting:\n`;
        errorMsg += `✓ Leica D5 powered ON and ready\n`;
        errorMsg += `✓ Bluetooth enabled on your device\n`;
        errorMsg += `✓ No other device connected to Leica\n`;
        errorMsg += `✓ Within 10 feet range\n`;
        errorMsg += `✓ Using Chrome browser (not Safari)\n\n`;
        errorMsg += `🆘 If problems persist, try restarting both devices`;
      }
      
      alert(errorMsg);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from Leica D5
  const disconnectLeica = async () => {
    await leicaManager.disconnect();
    setLeicaConnected(false);
    setLastMeasurement(null);
    alert('✅ Disconnected from Leica D5');
  };

  // Start drawing arrow (only in draw mode)
  const handleMouseDown = (e) => {
    if (!capturedPhoto || !drawMode) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDrawingArrow({ x1: x, y1: y, x2: x, y2: y, color: arrowColor });
  };
  
  // Update arrow end point while dragging
  const handleMouseMove = (e) => {
    if (!drawingArrow) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDrawingArrow({ ...drawingArrow, x2: x, y2: y });
  };
  
  // Finish drawing arrow
  const handleMouseUp = () => {
    if (!drawingArrow) return;
    
    // Only save if arrow has some length
    const dx = drawingArrow.x2 - drawingArrow.x1;
    const dy = drawingArrow.y2 - drawingArrow.y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 2) { // Minimum 2% of image size
      // Use last Leica measurement if available, otherwise ask for manual input
      const text = lastMeasurement ? lastMeasurement.feetInches : prompt('Enter measurement:', '');
      
      if (text) {
        setMeasurements([
          ...measurements,
          { ...drawingArrow, text, color: arrowColor }
        ]);
        // Stay in draw mode, don't exit automatically
      }
    }
    
    setDrawingArrow(null);
  };

  const removeMeasurement = (index) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!capturedPhoto) {
      alert('Please capture a photo first');
      return;
    }

    try {
      setUploading(true);

      // Create canvas with annotations
      const img = new Image();
      img.src = capturedPhoto;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Draw measurement arrows
      measurements.forEach((m) => {
        const x1 = (m.x1 / 100) * canvas.width;
        const y1 = (m.y1 / 100) * canvas.height;
        const x2 = (m.x2 / 100) * canvas.width;
        const y2 = (m.y2 / 100) * canvas.height;
        const color = m.color || '#FFD700';

        // Draw arrow line
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headlen = 20;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headlen * Math.cos(angle - Math.PI / 6),
          y2 - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          x2 - headlen * Math.cos(angle + Math.PI / 6),
          y2 - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Draw measurement text
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 30; // Above the arrow
        
        ctx.font = 'bold 32px Arial';
        const textWidth = ctx.measureText(m.text).width;
        
        // Text background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(midX - textWidth / 2 - 10, midY - 26, textWidth + 20, 42);
        
        // Text
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(m.text, midX, midY);
      });

      const annotatedPhoto = canvas.toDataURL('image/jpeg', 0.8);

      // Upload to server
      await axios.post(`${API_URL}/photos/upload`, {
        project_id: projectId,
        room_id: roomId,
        photo_data: annotatedPhoto,
        file_name: `photo_${Date.now()}.jpg`,
        metadata: {
          timestamp: new Date().toISOString(),
          notes,
          measurements: measurements.map(m => m.text)
        }
      });

      alert('✅ Photo saved successfully!');
      onPhotoAdded();
      onClose();
    } catch (error) {
      console.error('Failed to save photo:', error);
      alert('Failed to save photo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {!capturedPhoto ? (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="text-[#D4A574] text-center mb-8">
            <div className="text-8xl mb-6">📷</div>
            <p className="text-2xl font-bold text-[#D4C5A9]">Capture Photo</p>
            <p className="text-lg text-[#D4A574] mt-2">Take or select a photo to add measurements</p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-br from-[#D4A574] to-[#B48554] hover:from-[#E4B584] hover:to-[#C49564] text-black px-12 py-6 rounded-2xl font-bold text-2xl shadow-2xl transform hover:scale-105 transition-all"
          >
            📸 Take/Select Photo
          </button>
        </div>
      ) : (
        <div className="h-full flex flex-col relative">
          {/* PHOTO TAKES UP ALMOST ENTIRE SCREEN */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            <img 
              ref={imageRef}
              src={capturedPhoto}
              alt="Captured photo"
              className="max-w-full max-h-full object-contain"
              style={{ minHeight: '80vh', minWidth: '80vw' }}
            />
            
            {/* Touch overlay for measurements */}
            <div
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                const rect = e.target.getBoundingClientRect();
                const x = ((touch.clientX - rect.left) / rect.width) * 100;
                const y = ((touch.clientY - rect.top) / rect.height) * 100;
                setDrawingArrow({ x1: x, y1: y, x2: x, y2: y, color: arrowColor });
              }}
              onTouchMove={(e) => {
                if (!drawingArrow) return;
                const touch = e.touches[0];
                const rect = e.target.getBoundingClientRect();
                const x = ((touch.clientX - rect.left) / rect.width) * 100;
                const y = ((touch.clientY - rect.top) / rect.height) * 100;
                setDrawingArrow({ ...drawingArrow, x2: x, y2: y });
              }}
              onTouchEnd={() => {
                if (!drawingArrow) return;
                const dx = drawingArrow.x2 - drawingArrow.x1;
                const dy = drawingArrow.y2 - drawingArrow.y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length > 2) {
                  const text = lastMeasurement ? lastMeasurement.feetInches : prompt('Enter measurement:', '');
                  if (text) {
                    setMeasurements([...measurements, { ...drawingArrow, text, color: arrowColor }]);
                  }
                }
                setDrawingArrow(null);
              }}
              className="absolute inset-0 cursor-crosshair"
              style={{ zIndex: 20 }}
            />

            {/* SVG Overlay for measurements */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 25 }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                {[...new Set(measurements.map(m => m.color || '#FFD700'))].map((color) => (
                  <marker
                    key={`arrow-${color}`}
                    id={`arrowhead-${color.replace('#', '')}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill={color} />
                  </marker>
                ))}
              </defs>
              
              {/* Measurement arrows */}
              {measurements.map((m, index) => (
                <line
                  key={index}
                  x1={m.x1}
                  y1={m.y1}
                  x2={m.x2}
                  y2={m.y2}
                  stroke={m.color || '#FFD700'}
                  strokeWidth="0.8"
                  markerEnd={`url(#arrowhead-${(m.color || '#FFD700').replace('#', '')})`}
                />
              ))}
              
              {/* Drawing arrow */}
              {drawingArrow && (
                <line
                  x1={drawingArrow.x1}
                  y1={drawingArrow.y1}
                  x2={drawingArrow.x2}
                  y2={drawingArrow.y2}
                  stroke={drawingArrow.color}
                  strokeWidth="0.8"
                  markerEnd={`url(#arrowhead-${drawingArrow.color.replace('#', '')})`}
                  opacity="0.8"
                />
              )}
            </svg>
            
            {/* Measurement labels */}
            {measurements.map((m, index) => (
              <div
                key={index}
                className="absolute pointer-events-auto"
                style={{
                  left: `${(m.x1 + m.x2) / 2}%`,
                  top: `${(m.y1 + m.y2) / 2 - 5}%`,
                  transform: 'translate(-50%, -100%)',
                  zIndex: 30
                }}
              >
                <div 
                  className="bg-black bg-opacity-95 px-4 py-2 rounded-xl text-xl font-bold whitespace-nowrap shadow-2xl border-2"
                  style={{ 
                    color: m.color || '#FFD700',
                    borderColor: m.color || '#FFD700',
                    boxShadow: `0 0 20px ${m.color || '#FFD700'}40`
                  }}
                >
                  {m.text}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMeasurement(index);
                    }}
                    className="ml-3 text-red-400 hover:text-red-300 font-bold text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* COMPACT FLOATING CONTROLS */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="absolute top-4 right-4 bg-[#D4A574] hover:bg-[#C49564] text-black p-3 rounded-full font-bold text-xl shadow-2xl z-40"
          >
            ⚙️
          </button>

          {/* SLIDE-IN CONTROL PANEL */}
          {showControls && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/95 to-transparent p-6 z-50 transform transition-all duration-300">
              {/* Leica Status */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`px-4 py-2 rounded-xl font-bold text-sm ${leicaConnected ? 'bg-green-600' : 'bg-gray-700'}`}>
                  📏 Leica D5: {leicaConnected ? 'Connected' : 'Not Connected'}
                </div>
                <button
                  onClick={leicaConnected ? disconnectLeica : connectLeica}
                  disabled={connecting}
                  className="px-4 py-2 bg-[#D4A574] hover:bg-[#C49564] disabled:bg-gray-600 text-black rounded-xl font-bold text-sm"
                >
                  {connecting ? 'Connecting...' : (leicaConnected ? 'Disconnect' : 'Connect')}
                </button>
              </div>

              {/* Last Measurement */}
              {lastMeasurement && (
                <div className="bg-green-900 text-green-100 px-4 py-2 rounded-xl mb-4">
                  <div className="text-sm font-bold">Last Measurement: {lastMeasurement.feetInches}</div>
                </div>
              )}

              {/* Color Picker */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[#D4A574] font-bold text-sm">Arrow Color:</span>
                {['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setArrowColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      arrowColor === color ? 'border-white scale-110' : 'border-gray-600 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCapturedPhoto(null);
                    setMeasurements([]);
                    setNotes('');
                    setShowControls(false);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-bold"
                >
                  🔄 Retake
                </button>
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-xl font-bold"
                >
                  {uploading ? '⏳ Saving...' : '✅ Save Photo'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}